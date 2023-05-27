function create_shader(id) {
  // シェーダを格納する変数
  var shader;

  // HTMLからscriptタグへの参照を取得
  var scriptElement = document.getElementById(id);

  // scriptタグが存在しない場合は抜ける
  if (!scriptElement) {
    return;
  }

  // scriptタグのtype属性をチェック
  switch (scriptElement.type) {
    // 頂点シェーダの場合
    case "x-shader/x-vertex":
      shader = gl.createShader(gl.VERTEX_SHADER);
      break;

    // フラグメントシェーダの場合
    case "x-shader/x-fragment":
      shader = gl.createShader(gl.FRAGMENT_SHADER);
      break;
    default:
      return;
  }

  // 生成されたシェーダにソースを割り当てる
  gl.shaderSource(shader, scriptElement.text);

  // シェーダをコンパイルする
  gl.compileShader(shader);

  // シェーダが正しくコンパイルされたかチェック
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // 成功していたらシェーダを返して終了
    return shader;
  } else {
    // 失敗していたらエラーログをアラートする
    console.error(gl.getShaderInfoLog(shader));
  }
}

function create_program(vs, fs) {
  // プログラムオブジェクトの生成
  var program = gl.createProgram();

  // プログラムオブジェクトにシェーダを割り当てる
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);

  // シェーダをリンク
  gl.linkProgram(program);

  // シェーダのリンクが正しく行なわれたかチェック
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    // 成功していたらプログラムオブジェクトを有効にする
    gl.useProgram(program);

    // プログラムオブジェクトを返して終了
    return program;
  } else {
    // 失敗していたらエラーログをアラートする
    console.error(gl.getProgramInfoLog(program));
  }
}

// VBOを生成する関数
function create_vbo(data) {
  // バッファオブジェクトの生成
  var vbo = gl.createBuffer();

  // バッファをバインドする
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  // バッファにデータをセット
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

  // バッファのバインドを無効化
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // 生成した VBO を返して終了
  return vbo;
}

// IBOを生成する関数
function create_ibo(data) {
  // バッファオブジェクトの生成
  var ibo = gl.createBuffer();

  // バッファをバインドする
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

  // バッファにデータをセット
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);

  // バッファのバインドを無効化
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // 生成したIBOを返して終了
  return ibo;
}

// global
var c, cw, ch, mx, my, gl, run, eCheck;
var startTime;
var time = 0.0;
var tempTime = 0.0;
var fps = 1000 / 30;
var uniLocation = new Array();

let xScale = 1.1;
let yScale = 0.6;
let distortion = 0.5;
let w1 = 0.25;
let w2 = 0.46;
let w3 = 0.27;
let w4 = 0.33;
let w5 = 0.27;
let w6 = 0.71;

document.getElementById("xScale").addEventListener("input", (e) => {
  xScale = parseFloat(e.target.value);
});
document.getElementById("yScale").addEventListener("input", (e) => {
  yScale = parseFloat(e.target.value);
});
document.getElementById("distortion").addEventListener("input", (e) => {
  distortion = parseFloat(e.target.value);
});
document.getElementById("w1").addEventListener("input", (e) => {
  w1 = parseFloat(e.target.value);
});
document.getElementById("w2").addEventListener("input", (e) => {
  w2 = parseFloat(e.target.value);
});
document.getElementById("w3").addEventListener("input", (e) => {
  w3 = parseFloat(e.target.value);
});
document.getElementById("w4").addEventListener("input", (e) => {
  w4 = parseFloat(e.target.value);
});
document.getElementById("w5").addEventListener("input", (e) => {
  w5 = parseFloat(e.target.value);
});
document.getElementById("w6").addEventListener("input", (e) => {
  w6 = parseFloat(e.target.value);
});

const copy = document.getElementById("copy");

copy.addEventListener("click", () => {
  navigator.clipboard
    .writeText(
      `
  xScale: ${xScale}
  yScale: ${yScale}
  distortion: ${distortion}
  width red 1: ${w1}
  width green 1: ${w2}
  width blue 1: ${w3}
  width red 2: ${w4}
  width green 2: ${w5}
  width blue 2: ${w6}
  blur: ${document.getElementById("blur").value}
  opacity: ${document.getElementById("opacity").value}
  `
    )
    .then(function () {
      // クリップボードへ書きむ
      alert("クリップボードにコピーしました");
    });
});

function render() {
  // フラグチェック
  if (!run) {
    return;
  }

  // 時間管理
  time = (new Date().getTime() - startTime) * 0.001;

  // カラーバッファをクリア
  gl.clear(gl.COLOR_BUFFER_BIT);

  // uniform 関連
  gl.uniform1f(uniLocation[0], time + tempTime);
  gl.uniform2fv(uniLocation[1], [mx, my]);
  gl.uniform2fv(uniLocation[2], [cw, ch]);
  gl.uniform1f(uniLocation[3], xScale);
  gl.uniform1f(uniLocation[4], yScale);
  gl.uniform1f(uniLocation[5], distortion);
  gl.uniform1f(uniLocation[6], w1);
  gl.uniform1f(uniLocation[7], w2);
  gl.uniform1f(uniLocation[8], w3);
  gl.uniform1f(uniLocation[9], w4);
  gl.uniform1f(uniLocation[10], w5);
  gl.uniform1f(uniLocation[11], w6);

  // 描画
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.flush();

  // 再帰
  setTimeout(render, fps);
}

// checkbox
function checkChange(e) {
  run = e.currentTarget.checked;
  if (run) {
    startTime = new Date().getTime();
    render();
  } else {
    tempTime += time;
  }
}

// mouse
function mouseMove(e) {
  mx = e.offsetX / cw;
  my = e.offsetY / ch;
}

// onload
window.onload = function () {
  // canvas エレメントを取得
  c = document.getElementById("canvas");

  // canvas サイズ
  cw = window.innerWidth;
  ch = window.innerHeight;
  c.width = cw;
  c.height = ch;

  // エレメントを取得
  eCheck = document.getElementById("check");

  // イベントリスナー登録
  c.addEventListener("mousemove", mouseMove, true);
  eCheck.addEventListener("change", checkChange, true);

  // WebGL コンテキストを取得
  gl = c.getContext("webgl") || c.getContext("experimental-webgl");

  // シェーダ周りの初期化
  var prg = create_program(create_shader("vs"), create_shader("fs"));
  run = prg != null;
  if (!run) {
    eCheck.checked = false;
  }
  uniLocation[0] = gl.getUniformLocation(prg, "time");
  uniLocation[1] = gl.getUniformLocation(prg, "mouse");
  uniLocation[2] = gl.getUniformLocation(prg, "resolution");
  uniLocation[3] = gl.getUniformLocation(prg, "xScale");
  uniLocation[4] = gl.getUniformLocation(prg, "yScale");
  uniLocation[5] = gl.getUniformLocation(prg, "distortion");
  uniLocation[6] = gl.getUniformLocation(prg, "w1");
  uniLocation[7] = gl.getUniformLocation(prg, "w2");
  uniLocation[8] = gl.getUniformLocation(prg, "w3");
  uniLocation[9] = gl.getUniformLocation(prg, "w4");
  uniLocation[10] = gl.getUniformLocation(prg, "w5");
  uniLocation[11] = gl.getUniformLocation(prg, "w6");

  // 頂点データ回りの初期化
  var position = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
  var index = [0, 2, 1, 1, 2, 3];
  var vPosition = create_vbo(position);
  var vIndex = create_ibo(index);
  var vAttLocation = gl.getAttribLocation(prg, "position");
  gl.bindBuffer(gl.ARRAY_BUFFER, vPosition);
  gl.enableVertexAttribArray(vAttLocation);
  gl.vertexAttribPointer(vAttLocation, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);

  // その他の初期化
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  mx = 0.5;
  my = 0.5;
  startTime = new Date().getTime();

  // レンダリング関数呼出
  render();
};
