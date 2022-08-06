
// classes 


class Point{
  constructor(x,y) {
    this.x = x;
    this.y = y;
  }

  static distance(a,b){
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.hypot(dx,dy);
  }

  static angle(A,B){
    return (Math.atan2( A.y-B.y,A.x-B.x ) * 180 / Math.PI) - 90
  }
}

////////////////////


let Px = null,
Py = null;
let editor = window;
let toolSelected = "transformTool";



var hudsFeatures = {
  // tool[+]: transfrom tool -> resize
  transformResizeMouseDown: function (e) {
    let transformResizeMouseMove = hudsFeatures._transformResizeMouseMove();
    editor.addEventListener("mousemove", transformResizeMouseMove);
    editor.addEventListener(
      "mouseup", hudsFeatures._transformResizeMouseUp(transformResizeMouseMove),
      { once:true }
    );
  },
  _transformResizeMouseMove: function () {
    let Px=null, Py=null;

    return function(e){
      if (Px && Py) {
        selectedElement.resizeElement(
          window.scrollX - (Px - e.pageX),
          window.scrollY - (Py - e.pageY),
          e.shiftKey,
        );
        Px = e.pageX;
        Py = e.pageY;
      } else {
        Px = e.pageX;
        Py = e.pageY;
      }
    }
  },
  _transformResizeMouseUp: function(closureFunToRemove){
    return function (e) {
      huds.style.display = "inline-block";

      editor.removeEventListener(
        "mousemove",
        closureFunToRemove
      );
    }
  },

  // tool[+]: transform tool -> line edit
  lineEditMouseDown: function(e){
    let point1 = new Point(e.pageX, e.pageY);

    let lineEditMouseMove = hudsFeatures._lineEditMouseMove(point1);
    editor.addEventListener('mousemove',lineEditMouseMove)
  },
  _lineEditMouseMove: function(point1){
    let point2 = null, runOnce = false;
    return (e)=>{
      if (!runOnce){
        runOnce = true;
        point2 = new Point(e.pageX,e.pageY);
      }
      selectedElement.element.dataset.point1 = JSON.stringify(point1);
      selectedElement.element.dataset.point2 = JSON.stringify(point2);

      selectedElement.editLine();
      selectedElement.changeHuds();
      

    }
  },
  _lineEditMouseUp: function(e){

  }

};
let allHuds = {

  // MAIN HUD
  hud:{
    element:document.querySelector('#huds')
  },
  transfrom:{
    element:document.querySelector('#huds #transform')
  },
  transfrom_line:{
    element:document.querySelector('#huds #transform_line')
  },

  /* TRANSFORM RESIZE */
  transformBottomRight: {
    element: document.querySelector("#transform  #bottomRight"), 
    fireEventName: 'mousedown',
    func: hudsFeatures.transformResizeMouseDown,
  },

  /* LINE TOOL HUDS */ 
  lineLeft: {
    element:document.querySelector('#huds #transform_line #linePointLeft'),
    func: hudsFeatures.lineEditMouseDown,
    fireEventName:'mousedown',
  },
  lineRight: {
    element:document.querySelector('#huds #transform_line #linePointRight'),
    func: hudsFeatures.lineEditMouseDown,
    fireEventName:'mousedown',
  }
};



function InitEvents() {
  for (const hud in allHuds) {
    if (hud != ('hud' | 'transfrom' | 'transform_line')){
      allHuds[hud].element.addEventListener(
        allHuds[hud].fireEventName,
        allHuds[hud].func
      );
    }
    
  }
}
InitEvents();


document.onkeydown = function (event) {
  if (event.keyCode == 46) {
    if (selectedElement) {
      selectedElement.deleteCurrentElement();
    }
  }
};


function initUI() {
  let tools = document.querySelectorAll(".app--toolbar > *");

  for (const tool of tools) {
    tool.addEventListener("click", function () {
      for (let t of tools) {
        t.style.backgroundColor = "white";
      }
      this.style.backgroundColor = "#dcdcdc";
      toolSelected = this.id;
    });
  }
}
initUI();






let utils = {
  degradeTransform: function (transform, callback) {
    const _p = new Promise((resolve, reject) => {
      let data = {};

      data.matrix = transform.match(/matrix\((.+?\))/g);
      data.rotate = transform.match(/rotate\((.+?\))/g);
      data.translate = transform.match(/translate\((.+?\))/g);

      if (data.matrix) {
        data.matrix = data.matrix[0].replace(/(\(|\)|matrix)/gi, "").split(",");
      }
      if (data.rotate) {
        data.rotate = data.rotate[0].replace(/(\(|\)|rotate)/gi, "");
      }
      if (data.translate) {
        data.translate = data.translate[0].replace(/(\(|\)|translate)/gi, "").split(',');
      }

      resolve(data);
    });
    _p.then(callback, console.log);
  },

  updateTransform: function (data, element = null) {
    let transformString = "";
    if (data.translate) {
      transformString += "translate(" + data.translate + ")";
    }
    if (data.matrix) {
      transformString += "matrix(" + data.matrix + ")";
    }
    if (data.rotate) {
      transformString += "rotate(" + data.rotate + ")";
    }
    if (data.skew) {
      transformString += "skew(" + data.skew + ")";
    }
    
    if (element) {
      element.style.transform = transformString;
    } else {
      selectedElement.element.style.transform = transformString;
    }
  },
  convertElementsTransformToWidthAndHeight: function (element) {
    utils.degradeTransform(element.style.transform, function (transform) {
      let rect = element.getBoundingClientRect();
      transform.matrix[0] = "1";
      transform.matrix[3] = "1";

      utils.updateTransform(transform, element);

      utils.updateWidthAndHeight(rect.width, rect.height, element);
    });
  },

  updateWidthAndHeight: function(width, height, element, addToCurrent=false){
    if(addToCurrent){
      element.style.width = (element.offsetWidth + width) + 'px';
      element.style.width = (element.offsetHeight + height) + 'px';
    }
    else{
      element.style.width = width + 'px';
      element.style.height = height + 'px';
    }
  },

  returnNegOrPos: function (no) {
    if (no < 0) {
      return -1;
    } else {
      return 1;
    }
  },

  borderRadiusHudReset: function(){
    allHuds.borderRadiusBottomLeft.element.style.transform = "";
    allHuds.borderRadiusTopRight.element.style.transform = "";
    allHuds.borderRadiusTopLeft.element.style.transform = "";
    allHuds.borderRadiusBottomRight.element.style.transform = "";
  }

};




let selectedElement = {
  element: null,
  setCurrentElement: function (ele) {
    this.element = ele;
    selectedElement.ChangeHudsVisiblity();
    selectedElement.changeHuds();
  },
  setSelectedNone: function () {
    huds.style.display = "none";
    this.element = null;
  },
  changeHuds: function () {
    let elementType = selectedElement.element.getAttribute('data-type');
    if (elementType == 'rect-element' | elementType == 'circle-element'){
      utils.degradeTransform(this.element.style.transform, function (data) {
        if (data.translate) {
          let vals = data.translate;
          let rect = selectedElement.element.getBoundingClientRect();

          vals[0] = rect.x + "px";
          vals[1] = rect.y + "px";
          data.translate = vals.join();
          utils.updateTransform(data, huds);

          utils.updateWidthAndHeight(rect.width, rect.height, huds);
        }
      });
    }
    else if (elementType == 'line-element'){
      allHuds.transfrom_line.element.style.width = selectedElement.element.offsetHeight + "px";
      allHuds.transfrom_line.element.style.height = selectedElement.element.offsetHeight + "px";
      let rect = selectedElement.element.getBoundingClientRect();
      allHuds.transfrom_line.element.style.top = JSON.parse(selectedElement.element.dataset.point1).y + "px";
      allHuds.transfrom_line.element.style.left = JSON.parse(selectedElement.element.dataset.point1).x + "px";

      let transform1 = JSON.parse(selectedElement.element.dataset.point1).x + "px," + JSON.parse(selectedElement.element.dataset.point1).y + "px";
      utils.updateTransform({transform: transform1}, allHuds.lineLeft.element)

      let transform2 = JSON.parse(selectedElement.element.dataset.point2).x + "px," + JSON.parse(selectedElement.element.dataset.point2).y + "px";
      utils.updateTransform({translate: transform2}, allHuds.lineRight.element)

      
    }
  },
  ChangeHudsVisiblity: function (){
    let elementType = selectedElement.element.dataset.type;
    allHuds.hud.element.style.display = 'inline-block';
    if (elementType == 'rect-element'){
      allHuds.transfrom.element.style.display = 'inline-block';
      allHuds.transfrom_line.element.style.display = 'none';
    }
    else if(elementType == 'line-element'){
      allHuds.transfrom.element.style.display = 'none';
      allHuds.transfrom_line.element.style.display = 'inline-block';
    }
    else if (elementType == null){
      allHuds.hud.element.style.display = 'none';
    }
  },
  changePosition: function (x, y) {
    utils.degradeTransform(
      selectedElement.element.style.transform,
      function (data) {
        let vals = data.translate;
        if (vals) {
          vals[0] = parseInt(vals[0]) + x + "px";
          vals[1] = parseInt(vals[1]) + y + "px";
          data.translate = vals.join();
          selectedElement.changeHuds();
        } else {
          data.translate =  x + "px," + y + "px"
        }
        utils.updateTransform(data);
      }
    );
  },

  resizeElement: function (w, h, shift,alt) {
    let rect1 = selectedElement.element.getBoundingClientRect();
    
    if (shift){
      let max = Math.max(selectedElement.element.offsetWidth+w,selectedElement.element.offsetHeight+h);
      utils.updateWidthAndHeight(
        max, 
        max,
        selectedElement.element
        )
      }
    else{
      utils.updateWidthAndHeight(
        selectedElement.element.offsetWidth + w, 
        selectedElement.element.offsetHeight + h,
        selectedElement.element
        )
    }
    selectedElement.changeHuds();
  },

  editLine: function(){
    utils.degradeTransform(selectedElement.element.style.transform,function(data){
      let rotation = Point.angle(JSON.parse(selectedElement.element.dataset.point2),JSON.parse(selectedElement.element.dataset.point1));
      let distance = Point.distance(JSON.parse(selectedElement.element.dataset.point1),JSON.parse(selectedElement.element.dataset.point2));
      
      data.rotate = rotation+"deg"; 
      selectedElement.element.style.height = distance+"px";
      utils.updateTransform(data,selectedElement.element);
    })
  },

  deleteCurrentElement: function () {
    if (this.element) {
      document.getElementById("app--editor--view").removeChild(this.element);
      huds.style.display = "none";
      this.element = null;
    }
  },
};





window.onload = function () {
  editor.onmousedown = function (eventGlobal) {

    if (toolSelected === "transformTool") {
      
      if (["rect-element",'line-element','circle-element'].includes(eventGlobal.target.getAttribute("data-type"))) {
        selectedElement.setCurrentElement(eventGlobal.target);
        
        editor.addEventListener("mouseup", function () {
          editor.removeEventListener("mousemove", moving);
          editor.removeEventListener("mouseup", this);
          Px = null;
          Py = null;
        });
        editor.addEventListener("mousemove", moving);
        function moving(eventLocal) {
          if (Px && Py) {
            selectedElement.changePosition(
              window.scrollX - (Px - eventLocal.clientX),
              window.scrollY - (Py - eventLocal.clientY)
            );

            Px = eventLocal.clientX;
            Py = eventLocal.clientY;
          } else {
            Px = eventLocal.clientX;
            Py = eventLocal.clientY;
          }
        }
      } 
      else if(eventGlobal.target.getAttribute('data-type') == 'line-element'){
        selectedElement.setCurrentElement(eventGlobal.target);

      }
      else if (document.getElementById("app--editor--view") == eventGlobal.target) {
        selectedElement.setSelectedNone();
      }
    }

    else if (toolSelected === "createDivTool" | toolSelected === "createCircleTool") {

      var _movingcreateDivTool =  function () {

        let runOnce = false;
        let Px=null,Py=null;
        
        return function(eventLocal){
          if (!runOnce){
            runOnce = true;
            mouseMoved = true;
            if (toolSelected === "createCircleTool"){
              element.style.borderRadius = "50%";
              element.style.borderRadius = "50%";
              element.setAttribute("data-type", "circle-element");  
            }
            document
            .getElementById("app--editor--view")
            .insertBefore(
              element,
              document.getElementById("app--editor--view").lastChild
            );
            selectedElement.setCurrentElement(element);
            Px = eventLocal.pageX;
            Py = eventLocal.pageY;
          }
          console.log(eventLocal)
          selectedElement.resizeElement(
            window.scrollX - (Px - eventLocal.pageX),
            window.scrollY - (Py - eventLocal.pageY),
            eventLocal.shiftKey
          );
          Px = eventLocal.pageX;
          Py = eventLocal.pageY;

          selectedElement.changeHuds();
        }
      }

      function mouseup(eventLocal) {
        if (
          !mouseMoved &&
          document.getElementById("app--editor--view") == eventLocal.target
        ) {
          element.style.width = "100px";
          element.style.height = "100px";
          
          document
            .getElementById("app--editor--view")
            .insertBefore(
              element,
              document.getElementById("app--editor--view").lastChild
            );
          selectedElement.setCurrentElement(element);
          element = null;
          mouseMoved = false;
        }
        editor.removeEventListener("mousemove", movingCreateDivTool);
      }

      let movingCreateDivTool = _movingcreateDivTool();
      editor.addEventListener("mousemove", movingCreateDivTool);

      let mouseMoved = false;
      let element = document.createElement("div");
  
      if (toolSelected == 'createDivTool'){
        element.setAttribute("data-type", "rect-element");  
      }
      if (toolSelected == 'createCircleTool'){
        element.setAttribute("data-type", "circle-element");  
      }
      element.style.transform = "translate(" + eventGlobal.pageX + "px, " + eventGlobal.pageY + "px)";
      element.style.backgroundColor = "#009688";

      Px = null;
      Py = null;

      editor.addEventListener("mouseup", mouseup, {once:true});

    }

    else if (toolSelected == 'createLineTool'){
      
      let point1 = new Point(eventGlobal.pageX,eventGlobal.pageY);
      let lineElement = document.createElement('hr')
      lineElement.setAttribute('data-type',"line-element")
      lineElement.dataset.point1 = JSON.stringify(point1);
      
      
      function _movingCreateLineTool(){
        let runOnce = false;
        return (evnetLocal)=>{
          let point2 = new Point(evnetLocal.pageX,evnetLocal.pageY);
          
          if (!runOnce){
            runOnce = true;
            lineElement.style.transform = "translate("+point2.x+"px,"+point2.y+"px)"
            lineElement.style.transformOrigin = 'top center'
            
            document
            .getElementById("app--editor--view")
            .insertBefore(
              lineElement,
              document.getElementById("app--editor--view").lastChild
              );
              lineElement.dataset.point2 = JSON.stringify(point2);
            selectedElement.setCurrentElement(lineElement);
            }

            lineElement.dataset.point2 = JSON.stringify(point2);

            selectedElement.editLine();
            selectedElement.changeHuds();

        }
      }


      let movingCreateLineTool = _movingCreateLineTool();
      editor.addEventListener('mousemove',movingCreateLineTool)

      editor.addEventListener('mouseup',function(evnetLocal){
        editor.removeEventListener('mousemove', movingCreateLineTool)
      },{once:true})
    }
  };
};