//v2 UIのグループ化に対応したファイル。main.jsで分岐

//memo originalがつく変数は編集画面上での数値、screenがつく変数は現在の画面上での数値
const ORIGINAL_WIDTH = 375;
const ORIGINAL_HEIGHT = 667;
const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

const widthRatio = SCREEN_WIDTH / ORIGINAL_WIDTH;
const heightRatio = SCREEN_HEIGHT / ORIGINAL_HEIGHT;

const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

const getUiTopVal = (dataHeight, originalTop) => {
  const screenAspectRatio = window.innerWidth / window.innerHeight;
  const originalHeight = parseFloat(dataHeight) * window.innerHeight * 0.01;
  const currentHeight = originalHeight * (screenAspectRatio / ORIGINAL_ASPECT_RATIO);
  const topPx = parseFloat(originalTop) * window.innerHeight * 0.01;
  return topPx + (originalHeight - currentHeight);
};

//MEMO 単体UIは従来と同じ処理
const initArUisNotInGroup = (uisData) => {
  uisData.forEach((uiData) => {
    const uiDom = document.querySelector(`[data-ar-ui-id='${uiData.id}']`);
    const uiImg = uiDom.querySelector("img");

    uiDom.style.width = uiData.width;

    //要素が画面の上半分ならそのままのtopを、下半分なら画面縦横比に合わせて位置を補正
    const uiHeight =
      convertWidthPercentToPixel(uiData.width, SCREEN_WIDTH) *
      (uiImg.naturalHeight / uiImg.naturalWidth);

    const heightPercent = (uiHeight / window.innerHeight) * 100;
    if (parseFloat(uiData.position.top) + heightPercent / 2 < 50 || heightPercent > 100) {
      uiDom.style.top = uiData.position.top;
    } else {
      uiDom.style.top = getUiTopVal(uiData.height, uiData.position.top) + "px";
    }

    uiDom.style.left = uiData.position.left;
    uiDom.style["z-index"] = uiData.z_index || 0;

    uiDom.dataset.showOnDetectedMarker = uiData.is_detected;
    if (uiDom.dataset.showOnDetectedMarker === "true") {
      uiDom.style.display = "none";
    }
  });
};

//screenWidthは任意の画面幅
const convertWidthPercentToPixel = (originalWidthPerc, screenWidth) => {
  return parseFloat(originalWidthPerc) * 0.01 * screenWidth;
};

//gonデータの加工
const getLayoutData = (groupsData) => {
  //UI要素を上から順に並び替え、必要な数値を計算してオブジェクトへ格納
  const dataArranged = groupsData.map((groupData) => {
    return {
      groupId: groupData.ar_ui_group_id,
      groupDom: document.querySelector(
        `[data-ar-ui-group-id='${groupData.ar_ui_group_id}']`
      ),
      groupLeftOriginal: groupData.position_x,
      groupTopOriginal: groupData.position_y,
      groupZIndex: groupData.z_index || 0,

      arUis: groupData.ar_uis
        .map((uiData) => {
          const uiDom = document.querySelector(`[data-ar-ui-id='${uiData.id}']`);
          const uiImg = uiDom.querySelector("img");
          const uiWidthOriginal = convertWidthPercentToPixel(
            uiData.width,
            ORIGINAL_WIDTH
          );
          const uiHeightOriginal =
            uiWidthOriginal * (uiImg.naturalHeight / uiImg.naturalWidth);
          const uiLeftOriginal = uiData.position_x;
          const uiTopOriginal = uiData.position_y;
          const uiZIndex = uiData.z_index || 0;

          return {
            uiDom,
            uiImg,
            uiWidthOriginal,
            uiHeightOriginal,
            uiLeftOriginal,
            uiTopOriginal,
            uiZIndex,
          };
        })
        //上から順に並び替える
        .sort((a, b) => {
          return a.uiTopOriginal - b.uiTopOriginal;
        }),
    };
  });

  const dataArrangedWithAfterProcess = dataArranged.map((groupData) => {
    const uis = groupData.arUis;
    if (!uis.length) return;

    //編集画面でのグループの幅
    //右端の位置が一番右にある要素を取得して、その数値からグループの左位置を引く
    const uiAtRight = uis.slice().sort((a, b) => {
      return a.uiLeftOriginal + a.uiWidthOriginal < b.uiLeftOriginal + b.uiWidthOriginal
        ? 1
        : -1;
    })[0];

    const groupWidthOriginal =
      uiAtRight.uiLeftOriginal + uiAtRight.uiWidthOriginal - groupData.groupLeftOriginal;

    //編集画面でのグループの高さ
    //下端の位置が一番下にある要素を取得して、その数値からグループの上位置を引く
    const uiAtBottom = uis.slice().sort((a, b) => {
      return a.uiTopOriginal + a.uiHeightOriginal < b.uiTopOriginal + b.uiHeightOriginal
        ? 1
        : -1;
    })[0];
    const groupHeightOriginal =
      uiAtBottom.uiTopOriginal + uiAtBottom.uiHeightOriginal - groupData.groupTopOriginal;

    //編集画面でのグループの下余白
    const groupBottomOffsetOriginal =
      ORIGINAL_HEIGHT - (groupData.groupTopOriginal + groupHeightOriginal);

    //下の余白の方が広ければ上起点、上の余白が広ければ下起点
    const groupOriginPosition =
      groupData.groupTopOriginal < groupBottomOffsetOriginal ? "top" : "bottom";

    //必要なスクリーン上の数値を格納していく
    const groupTopScreen = groupData.groupTopOriginal * heightRatio;
    const groupBottomScreen =
      (ORIGINAL_HEIGHT - (groupData.groupTopOriginal + groupHeightOriginal)) *
      heightRatio;
    const groupHeightScreen = groupHeightOriginal * widthRatio;
    const groupWidthScreen = groupWidthOriginal * widthRatio;

    return {
      groupWidthOriginal,
      groupHeightOriginal,
      groupBottomOffsetOriginal,
      groupOriginPosition,
      groupTopScreen,
      groupBottomScreen,
      groupHeightScreen,
      groupWidthScreen,
      ...groupData,
    };
  });

  return dataArrangedWithAfterProcess;
};

//画面からはみ出るUIグループの調整
const fitGroupToScreen = (groupData) => {
  //①グループの高さが画面の高さを超えている場合は画面いっぱいの高さで表示
  if (groupData.groupHeightScreen >= SCREEN_HEIGHT) {
    groupData.groupDom.style.top = 0;
    groupData.groupDom.style.bottom = 0;

    const adjustScale = (SCREEN_HEIGHT / groupData.groupHeightScreen) * widthRatio;
    groupData.groupDom.style.transformOrigin = "top left";

    //左起点なので左右位置を調整する
    const groupWidthAdjusted = groupData.groupWidthOriginal * adjustScale;

    const translateX = (groupData.groupWidthScreen - groupWidthAdjusted) / 2;

    groupData.groupDom.style.transform = `translateX(${translateX}px) scale(${adjustScale})`;

    return;
  }

  //②グループの高さが画面の高さを超えないが、下端または上端が画面からはみ出る場合、上下の余白比を調整
  const totalOffsetScreen = SCREEN_HEIGHT - groupData.groupHeightScreen;

  //②-A上起点でグループの下端が画面の下端を超える場合
  if (
    groupData.groupOriginPosition === "top" &&
    groupData.groupTopScreen + groupData.groupHeightScreen > SCREEN_HEIGHT
  ) {
    const topOffsetRatio =
      groupData.groupTopOriginal / groupData.groupBottomOffsetOriginal;

    groupData.groupDom.style.top = totalOffsetScreen * topOffsetRatio + "px";

    return;
  }

  //②-B下起点でグループの上端が画面の上端を超える場合
  if (
    groupData.groupOriginPosition === "bottom" &&
    groupData.groupBottomScreen + groupData.groupHeightScreen > SCREEN_HEIGHT
  ) {
    const bottomOffsetRatio =
      groupData.groupBottomOffsetOriginal / groupData.groupTopOriginal;

    groupData.groupDom.style.bottom = totalOffsetScreen * bottomOffsetRatio + "px";
    return;
  }
};

const initArUisInGroup = (groupData) => {
  const layoutData = getLayoutData(groupData);

  layoutData.forEach((groupData) => {
    if (!groupData) return;

    groupData.arUis.forEach((uiData) => {
      uiData.uiDom.style.position = "absolute";
      uiData.uiDom.style.width = uiData.uiWidthOriginal + "px";
      uiData.uiDom.style.left =
        uiData.uiLeftOriginal - groupData.groupLeftOriginal + "px";
      uiData.uiDom.style.top = uiData.uiTopOriginal - groupData.groupTopOriginal + "px";

      uiData.uiDom.style.zIndex = uiData.uiZIndex;
    });

    groupData.groupDom.style.position = "absolute";

    if (groupData.groupOriginPosition === "top") {
      groupData.groupDom.style.top = groupData.groupTopScreen + "px";
      groupData.groupDom.style.transformOrigin = "top left";
    } else if (groupData.groupOriginPosition === "bottom") {
      groupData.groupDom.style.bottom = groupData.groupBottomScreen + "px";
      groupData.groupDom.style.transformOrigin = "bottom left";
    }

    groupData.groupDom.style.left = groupData.groupLeftOriginal * widthRatio + "px";

    groupData.groupDom.style.width = groupData.groupWidthOriginal + "px";
    groupData.groupDom.style.height = groupData.groupHeightOriginal + "px";

    groupData.groupDom.style.transform = `scale(${widthRatio})`;

    groupData.groupDom.style.zIndex = groupData.groupZIndex;

    fitGroupToScreen(groupData);
  });
};

//暫定対応！！横画面でページを開いた時に撮影ボタンの位置とサイズを固定で調整する
const handleCaptureButtonInLandscapeScreen = () => {
  const captureButton = document.querySelector("[data-ar-ui-name='撮影ボタン']");
  if (!captureButton) return;

  const adjustCaptureButton = () => {
    //innerHeightの更新に若干タイムラグがあるので
    setTimeout(() => {
      captureButton.style.left = "";
      captureButton.style.right = "40px";
      captureButton.style.top = `${window.innerHeight / 2 - 38}px`;
      captureButton.style.width = "76px";
    }, 100);
  };

  //最初から横画面だった場合
  if (Math.abs(window.orientation) === 90) {
    adjustCaptureButton();
  }
  //最初は縦画面だった場合
  else {
    window.addEventListener("orientationchange", (e) => {
      if (Math.abs(window.orientation) === 90) {
        adjustCaptureButton();
      }
    });
  }
};

export const initArUiGroups = ({ arUiGroupsData }) => {
  const arUiContainer = document.getElementById("ar-ui-container");

  //グループに属さないUIをまとめたデータ
  const singleUisGroupData = arUiGroupsData.find((d) => d.ar_ui_group_id === null);
  initArUisNotInGroup(singleUisGroupData.ar_uis);

  //グループに属するUIをまとめたデータ
  const groupUisGroupData = arUiGroupsData.filter((d) => d.ar_ui_group_id !== null);
  initArUisInGroup(groupUisGroupData);

  arUiContainer.style.display = "block";

  handleCaptureButtonInLandscapeScreen();
};
