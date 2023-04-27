// global
var c, cw, ch, mx, my, gl, run, eCheck;
var startTime;
var time = 0.0;
var tempTime = 0.0;
var fps = 1000 / 30;
var uniLocation = new Array();
let texture;

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

// VBOをバインドし登録する関数
function set_attribute(vbo, attL, attS) {
  // 引数として受け取った配列を処理する
  for (var i in vbo) {
    // バッファをバインドする
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);

    // attributeLocationを有効にする
    gl.enableVertexAttribArray(attL[i]);

    // attributeLocationを通知し登録する
    gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
  }
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

// テクスチャを生成する関数
function create_texture(source) {
  // イメージオブジェクトの生成
  var img = new Image();

  // データのオンロードをトリガーにする
  img.onload = function () {
    // テクスチャオブジェクトの生成
    var tex = gl.createTexture();

    // テクスチャをバインドする
    gl.bindTexture(gl.TEXTURE_2D, tex);

    // テクスチャへイメージを適用
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    // ミップマップを生成
    gl.generateMipmap(gl.TEXTURE_2D);

    // テクスチャのバインドを無効化
    gl.bindTexture(gl.TEXTURE_2D, null);

    // 生成したテクスチャをグローバル変数に代入
    texture = tex;
  };

  // イメージオブジェクトのソースを指定
  img.src = source;
}

function render() {
  // フラグチェック
  if (!run) {
    return;
  }

  // 時間管理
  // time = (new Date().getTime() - startTime) * 0.001;

  // カラーバッファをクリア
  gl.clear(gl.COLOR_BUFFER_BIT);

  // uniform 関連
  gl.uniform1f(uniLocation[0], time + tempTime);
  gl.uniform2fv(uniLocation[1], [mx, my]);
  gl.uniform2fv(uniLocation[2], [cw, ch]);

  // テクスチャをバインドする
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // uniform変数にテクスチャを登録
  gl.uniform1i(uniLocation[1], 0);

  // 描画
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.flush();

  // 再帰
  setTimeout(render, fps);
}

window.addEventListener("wheel", (e) => {
  time += Math.abs(e.deltaY * 0.0006);
});

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
  cw = 1024;
  ch = 1024;
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
  uniLocation[3] = gl.getUniformLocation(prg, "texture");

  // 頂点データ回りの初期化
  const position = [
    -1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0,
  ];
  // 頂点色
  const color = [
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    1.0,
  ];

  // テクスチャ座標
  const textureCoord = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
  const index = [0, 2, 1, 1, 2, 3];

  const vPosition = create_vbo(position);
  const vColor = create_vbo(color);
  const vTextureCoord = create_vbo(textureCoord);
  const VBOList = [vPosition, vColor, vTextureCoord];

  const vIndex = create_ibo(index);

  const attLocation = new Array();
  attLocation[0] = gl.getAttribLocation(prg, "position");
  attLocation[1] = gl.getAttribLocation(prg, "color");
  attLocation[2] = gl.getAttribLocation(prg, "textureCoord");

  const attStride = new Array();
  attStride[0] = 3;
  attStride[1] = 4;
  attStride[2] = 2;

  set_attribute(VBOList, attLocation, attStride);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);

  // 有効にするテクスチャユニットを指定
  gl.activeTexture(gl.TEXTURE0);

  create_texture("textures/text_sample_3.png");
  // create_texture("/textures/sample.jpeg");

  // その他の初期化
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  mx = 0.5;
  my = 0.5;
  startTime = new Date().getTime();

  // レンダリング関数呼出
  render();
};
