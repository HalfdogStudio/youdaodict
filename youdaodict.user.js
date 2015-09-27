// ==UserScript==
// @id             youdaodict-greasemonkey-reverland-2015-09-26
// @name           youdaodict
// @version        1.0
// @namespace      youdao
// @author         Liu Yuyang(sa@linuxer.me)
// @description    一个屏幕取词脚本
// @include        *
// @grant          GM_xmlhttpRequest
// ==/UserScript==
//
// 我碰到几个问题
// 1. scriptish GM_xmlhttpRequest 经检查请求能正常发出接收，onload回调没能触发。我特么google了半天翻遍了gm的wiki，scriptish的wiki和github issue，stackoverflow上的问答。最后换了GreaseMonkey终于可以了。。。
// 2. 然后发现GM_log不能用。。。不grant连报错都没有都不运行。。grant也没个反应。。。
// 3. 忘记xmlhttpRequest的异步性质了，特么在回调中改写闭包中的值，而闭包中的值undefined在回调完成前就返回了。好在这种问题不像第一个这么纠结，只是js的特性而已。
// [DONE】
// 美化和安排显示些什么东西，我应该简单版还是复杂版？
// 如果时简单版本，那就设置下样式只显示这些就好
// 如果时复杂版本，如果有单词释义(basic)且errorCode为0，显示音标、详细释义，就不显示简单版本了？
// 判断屏幕边界更好放置弹窗。
// TODO
// 像github这种网站会禁止第三方媒体链入(CSP)，所以就算有道可以用https访问也会被浏览器block掉
//

window.document.body.addEventListener("mouseup", translate, false);

function translate(e) {
  // remove previous .youdaoPopup if exists
  var previous = document.querySelector(".youdaoPopup");
  if (previous) {
    document.body.removeChild(previous);
  }
  //console.log("translate start");
  var selectObj = document.getSelection()

  // if #text node
  if (selectObj.anchorNode.nodeType == 3) {
    //GM_log(selectObj.anchorNode.nodeType.toString());
    var word = selectObj.toString();
    if (word == "") {
      return;
    }
    //console.log("word:", word);
    var ts = new Date().getTime();
    //console.log("time: ", ts);
    var mx = e.clientX;
    var my = e.clientY;
    translate(word, ts);

  }

  function popup(mx, my, result) {
    //console.log(mx)
    //console.log(my)
    //console.log("popup window!")
    var youdaoWindow = document.createElement('div');
    youdaoWindow.classList.toggle("youdaoPopup");
    // parse 
    // 1. trans 
    var dictJSON = JSON.parse(result);
    console.log(dictJSON);
    var query = dictJSON['query'];
    var errorCode = dictJSON['errorCode'];
    if (dictJSON['basic']) {
      word();
    } else {
      sentence();
    }
    // main window
    // first insert into dom then there is offsetHeight！IMPORTANT！
    document.body.appendChild(youdaoWindow);
    youdaoWindow.style.textAlign = "left";
    youdaoWindow.style.display = "block";
    youdaoWindow.style.position = "fixed";
    youdaoWindow.style.background = "lightblue";
    youdaoWindow.style.borderRadius = "5px";
    youdaoWindow.style.boxShadow = "0 0 5px 0"
    youdaoWindow.style.opacity = "0.9"
    youdaoWindow.style.width = "200px";
    youdaoWindow.style.wordWrap = "break-word";
    // I can judge border conditions here, but TODO 
    // FIXME bad hack:(
    youdaoWindow.style.left = mx + 10 + "px";
    if (mx + 200 + 30 >= window.innerWidth) {
      youdaoWindow.style.left = parseInt(youdaoWindow.style.left) - 200 + "px";
    }
    //console.log(my, window.innerHeight)
    //console.log(youdaoWindow.offsetHeight)
    if (my + youdaoWindow.offsetHeight + 30 >= window.innerHeight) {
      youdaoWindow.style.bottom = "20px";
    } else {
      youdaoWindow.style.top = my + 10 + "px";
    }
    youdaoWindow.style.padding = "5px";
    youdaoWindow.style.zIndex = '999999'

    function word() {

      // play
      function play(word) {
        var soundUrl = `https://dict.youdao.com/dictvoice?type=2&audio=${word}`
        //console.log(soundUrl);
        // remove legacy
        var dummySound = document.querySelector('.youdao_hidden_sound')
        if (!dummySound) {
          dummySound = document.createElement('span');
          dummySound.classList.toggle("youdao_hidden_sound");
        }
        dummySound.innerHTML = `<audio src="${soundUrl}" preload="auto" hidden="true" autoplay="true">`;
        header.appendChild(dummySound);
      }

      var basic = dictJSON['basic'];
      var header = document.createElement('p');
      // header 
      var span = document.createElement('span')
      span.innerHTML = query;
      header.appendChild(span)
      // phonetic if there is
      var phonetic = basic['phonetic'];
      if (phonetic) {
        var phoneticNode = document.createElement('span')
        phoneticNode.innerHTML = '[' + phonetic + ']'
        phoneticNode.style.cursor = "pointer";
        header.appendChild(phoneticNode);
        var playLogo = document.createElement('span');
        header.appendChild(phoneticNode);
        phoneticNode.addEventListener('mouseup', function(e){
          if (e.target === phoneticNode) {
          }
          e.stopPropagation();
          play(query)}, false);
      }
      header.style.color = "darkBlue";
      header.style.margin = "0";
      header.style.padding = "0";
      span.style.fontweight = "900";
      span.style.color = "black";

      youdaoWindow.appendChild(header);
      var hr = document.createElement('hr')
      hr.style.margin = "0";
      hr.style.padding = "0";
      hr.style.height = "1px";
      hr.style.borderTop = "dashed 1px black";
      youdaoWindow.appendChild(hr);
      var ul = document.createElement('ul');
      // ul style
      ul.style.margin = "0";
      ul.style.padding = "0";
      basic['explains'].map(function(trans) {
        var li = document.createElement('li');
        li.style.listStyle = "none";
        li.appendChild(document.createTextNode(trans));
        ul.appendChild(li);
      })
      youdaoWindow.appendChild(ul);

    }

    function sentence() {
      var ul = document.createElement('ul');
      // ul style
      ul.style.margin = "0";
      ul.style.padding = "0";
      dictJSON['translation'].map(function(trans) {
        var li = document.createElement('li');
        li.style.listStyle = "none";
        li.appendChild(document.createTextNode(trans));
        ul.appendChild(li);
      })
      youdaoWindow.appendChild(ul);
    }
  }


  function translate(word, ts) {
    var reqUrl = `http://fanyi.youdao.com/openapi.do?type=data&doctype=json&version=1.1&relatedUrl=http%3A%2F%2Ffanyi.youdao.com%2F%23&keyfrom=fanyiweb&key=null&translate=on&q=${word}&ts=${ts}`
    //console.log("request url: ", reqUrl);
    // scriptish: 确实发出了，但是？为啥onload没用？
    var ret = GM_xmlhttpRequest({
      method: "GET",
      url: reqUrl,
      headers: {"Accept": "application/json"},  //这句没啥用
      onreadystatechange: function(res) {
        //console.log("Request state changed to: " + res.readyState);
      },
      onload: function(res) {
        var retContent = res.response;
        //console.log(retContent)
        popup(mx, my, retContent);
      },
      onerror: function(res) {
        console.log("error");
      }
    });
  }
}
