type IHAlign = 'left' | 'center' | 'right';
type IVAlign = 'top' | 'center' | 'bottom';
declare var module: any;
declare var define: any;
declare var cytoscape: any;

interface CytoscapeNodeHtmlParams {
  query?: string;
  halign?: IHAlign;
  valign?: IVAlign;
  halignBox?: IHAlign;
  valignBox?: IVAlign;
  cssClass?: string;
  edgehtmlTiltPoint1?: 'sourceNode' | 'targetNode' | number;
  edgehtmlTiltPoint2?: 'sourceNode' | 'targetNode' | number;
  edgehtmlLocation?: 'start' | 'end' | 'center';
  tpl?: (d: any) => string;
}

interface CytoscapeContainerParams {
  enablePointerEvents?: boolean;
}

(function () {
  'use strict';
  const $$find = function <T>(arr: T[], predicate: (a: T) => boolean) {
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    const length = arr.length >>> 0;
    // eslint-disable-next-line prefer-rest-params
    const thisArg = arguments[1];
    let value;

    for (let i = 0; i < length; i++) {
      value = arr[i];
      if (predicate.call(thisArg, value, i, arr)) {
        return value;
      }
    }
    return undefined;
  };

  interface ICyEventObject {
    cy: any;
    type: string;
    target: any;
  }

  interface ICytoscapeNodeHtmlPosition {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  interface ILabelElement {
    data?: any;
    position?: ICytoscapeNodeHtmlPosition;
    node: HTMLElement;
    _cy: any;
  }

  interface HashTableElements {
    [key: string]: LabelElement;
  }

  class LabelElement {
    public tpl: (d: any) => string;

    private _position: number[];
    private _node: HTMLElement;
    private _align: [number, number, number, number];
    private _cy: any;
    private _params: CytoscapeNodeHtmlParams;
    constructor(
      { node, position = null, data = null, _cy }: ILabelElement,
      params: CytoscapeNodeHtmlParams
    ) {
      // console.log('inside htmllable constructor', node);
      this._params = params;
      this.updateParams(params);
      this._node = node;
      this._cy = _cy;

      this.initStyles(params.cssClass);

      if (data) {
        this.updateData(data);
      }
      if (position && data['source'] && data['target']) {
        this.updateEdgePosition(position, data.id);
      } else if (position) {
        this.updatePosition(position);
      }
    }

    updateParams({
      tpl = () => '',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cssClass = null,
      halign = 'center',
      valign = 'center',
      halignBox = 'center',
      valignBox = 'center',
    }: CytoscapeNodeHtmlParams) {
      const _align = {
        top: -0.5,
        left: -0.5,
        center: 0,
        right: 0.5,
        bottom: 0.5,
      };

      this._align = [
        _align[halign],
        _align[valign],
        100 * (_align[halignBox] - 0.5),
        100 * (_align[valignBox] - 0.5),
      ];
      this.tpl = tpl;
      if (this._params.edgehtmlTiltPoint1 == undefined) {
        this._params.edgehtmlTiltPoint1 = 'sourceNode';
      }
      if (this._params.edgehtmlTiltPoint2 == undefined) {
        this._params.edgehtmlTiltPoint2 = 'targetNode';
      }
    }

    updateData(data: any) {
      while (this._node.firstChild) {
        this._node.removeChild(this._node.firstChild);
      }

      const children = new DOMParser().parseFromString(
        this.tpl(data),
        'text/html'
      ).body.children;

      for (let i = 0; i < children.length; ++i) {
        const el = children[i];
        this._node.appendChild(el);
      }
    }

    getNode(): HTMLElement {
      return this._node;
    }

    updatePosition(pos: ICytoscapeNodeHtmlPosition) {
      this._renderPosition(pos);
    }
    updateEdgePosition(pos: ICytoscapeNodeHtmlPosition, id: string) {
      this._renderEdgePosition(pos, id);
    }

    private initStyles(cssClass: string) {
      const stl = this._node.style;
      stl.position = 'absolute';
      if (cssClass && cssClass.length) {
        this._node.classList.add(cssClass);
      }
    }

    private _renderPosition(position: ICytoscapeNodeHtmlPosition) {
      const prev = this._position;
      const x = position.x + this._align[0] * position.w;
      const y = position.y + this._align[1] * position.h;

      if (!prev || prev[0] !== x || prev[1] !== y) {
        this._position = [x, y];

        const valRel = `translate(${this._align[2]}%,${this._align[3]}%) `;
        const valAbs = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) `;
        const val = valRel + valAbs;
        const stl = <any>this._node.style;
        stl.webkitTransform = val;
        stl.msTransform = val;
        stl.transform = val;
      }
    }
    private _renderEdgePosition(
      position: ICytoscapeNodeHtmlPosition,
      id: string
    ) {
      let edge = this._cy.$('#' + id);
      let cp = edge.controlPoints();
      let p1: any;
      let p2: any;
      if (
        cp?.length &&
        this._params?.edgehtmlTiltPoint1 != undefined &&
        typeof this._params.edgehtmlTiltPoint1 == 'number'
      ) {
        try {
          p1 = cp[this._params.edgehtmlTiltPoint1];
        } catch (error) {
          console.error(
            'edgehtmlTiltPoint1 is not a valid control point number'
          );
        }
      } else if (
        this._params?.edgehtmlTiltPoint1 != undefined &&
        this._params.edgehtmlTiltPoint1 == 'targetNode'
      ) {
        p1 = edge.targetEndpoint();
      } else {
        p1 = edge.sourceEndpoint();
      }

      if (
        cp?.length &&
        this._params?.edgehtmlTiltPoint2 != undefined &&
        typeof this._params.edgehtmlTiltPoint2 == 'number'
      ) {
        try {
          p2 = cp[this._params.edgehtmlTiltPoint2];
        } catch (error) {
          console.error(
            'edgehtmlTiltPoint2 is not a valid control point number'
          );
        }
      } else if (
        this._params?.edgehtmlTiltPoint2 != undefined &&
        this._params.edgehtmlTiltPoint2 == 'sourceNode'
      ) {
        p2 = edge.sourceEndpoint();
      } else {
        p2 = edge.targetEndpoint();
      }

      var angleDeg = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
      if (angleDeg > 90) {
        angleDeg = -90 + (angleDeg - 90);
      } else if (angleDeg < -90) {
        angleDeg = 90 + (angleDeg + 90);
      }
      const prev = this._position;
      const x = position.x + this._align[0] * position.w;
      const y = position.y + this._align[1] * position.h;
      let display = 'none';
      if (!prev || prev[0] !== x || prev[1] !== y) {
        this._position = [x, y];
        if (x == 0 || y == 0) {
          display = 'none';
        } else {
          display = 'block';
        }
        const valRel = `translate(${this._align[2]}%,${this._align[3]}%) `;
        const valAbs = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) `;
        const val = valRel + valAbs + `rotate(${angleDeg}deg)`;
        const stl = <any>this._node.style;
        stl.webkitTransform = val;
        stl.msTransform = val;
        stl.transform = val;
        stl.display = display;
      }
    }
  }

  /**
   * LabelContainer
   * Html manipulate, find and upgrade nodes
   * it don't know about cy.
   */
  class LabelContainer {
    private _elements: HashTableElements;
    private _node: HTMLElement;
    private _cy: any;
    private _param: CytoscapeNodeHtmlParams;

    constructor(node: HTMLElement, _cy: any) {
      this._node = node;
      this._elements = <HashTableElements>{};
      this._cy = _cy;
    }

    addOrUpdateElem(
      id: string,
      param: CytoscapeNodeHtmlParams,
      payload: { data?: any; position?: ICytoscapeNodeHtmlPosition } = {},
      _cy: any
    ) {
      const cur = this._elements[id];

      if (cur) {
        this._param = param;
        cur.updateParams(param);
        cur.updateData(payload.data);
        if (
          id.includes('task') ||
          id.includes('workflow') ||
          id.includes('canvas')
        ) {
          cur.updatePosition(payload.position);
        } else {
          cur.updateEdgePosition(payload.position, id);
        }

        const startEvent = new Event('start');
        document.dispatchEvent(startEvent);
      } else {
        const nodeElem = document.createElement('div');
        var observer = new MutationObserver(function (mutations) {
          if (document.contains(nodeElem)) {
            let cyNode = _cy.nodes(`#${nodeElem.children[0].id.split(':')[1]}`);
            cyNode.data('htmlNode', nodeElem);
            try {
              cyNode.style({
                width: nodeElem.offsetWidth / 0.6,
                height: nodeElem.offsetHeight / 0.6,
              });
            } catch (err) {
              console.warn(
                'cytoscape.js-html-node: unable to create html label',
                err
              );
            }
            observer.disconnect();
          }
        });

        observer.observe(document, {
          attributes: false,
          childList: true,
          characterData: false,
          subtree: true,
        });
        this._node.appendChild(nodeElem);

        this._elements[id] = new LabelElement(
          {
            node: nodeElem,
            data: payload.data,
            position: payload.position,
            _cy: _cy,
          },
          param
        );
      }
    }

    removeElemById(id: string) {
      if (this._elements[id]) {
        this._node.removeChild(this._elements[id].getNode());
        delete this._elements[id];
      }
    }

    updateElemPosition(id: string, position?: ICytoscapeNodeHtmlPosition) {
      let node = this._cy.$('#' + id);
      let isEdge = false;
      if (node.length) {
        isEdge = node.isEdge() ? true : false;
      }

      const ele = this._elements[id];
      console.log(isEdge);

      if (ele && isEdge) {
        ele.updateEdgePosition(position, id);
      } else if (ele) {
        ele.updatePosition(position);
      }
    }

    updatePanZoom({
      pan,
      zoom,
    }: {
      pan: { x: number; y: number };
      zoom: number;
    }) {
      const val = `translate(${pan.x}px,${pan.y}px) scale(${zoom})`;
      const stl = <any>this._node.style;
      const origin = 'top left';

      stl.webkitTransform = val;
      stl.msTransform = val;
      stl.transform = val;
      stl.webkitTransformOrigin = origin;
      stl.msTransformOrigin = origin;
      stl.transformOrigin = origin;
    }
  }

  function cyNodeHtmlLabel(
    _cy: any,
    params: CytoscapeNodeHtmlParams[],
    options?: CytoscapeContainerParams
  ) {
    const _params = !params || typeof params !== 'object' ? [] : params;
    const _lc = createLabelContainer();

    _cy.one('render', (e: any) => {
      createNodesCyHandler(e);
      wrapCyHandler(e);
    });
    _cy.on('add', (e: any) => {
      addCyHandler(e, _cy);
    });
    _cy.on('layoutstop', layoutstopHandler);
    _cy.on('remove', removeCyHandler);
    _cy.on('data', (e: any) => updateDataOrStyleCyHandler(e, _cy));
    _cy.on('style', (e: any) => updateDataOrStyleCyHandler(e, _cy));
    _cy.on('pan zoom', wrapCyHandler);
    _cy.on('position bounds', moveCyHandler); // "bounds" - not documented event

    return _cy;

    function createLabelContainer(): LabelContainer {
      const _cyContainer = _cy.container();
      const _titlesContainer = document.createElement('div');

      const _cyCanvas = _cyContainer.querySelector('canvas');
      const cur = _cyContainer.querySelector("[class^='cy-node-html']");
      if (cur) {
        _cyCanvas.parentNode.removeChild(cur);
      }

      const stl: any = _titlesContainer.style;
      stl.position = 'absolute';
      stl['z-index'] = 9;
      stl.width = '500px';
      stl.margin = '0px';
      stl.padding = '0px';
      stl.border = '0px';
      stl.outline = '0px';
      stl.outline = '0px';

      if (options && options.enablePointerEvents !== true) {
        stl['pointer-events'] = 'none';
      }

      _cyCanvas.parentNode.appendChild(_titlesContainer);

      return new LabelContainer(_titlesContainer, _cy);
    }

    function createNodesCyHandler({ cy }: ICyEventObject) {
      _params.forEach((x) => {
        cy.elements(x.query).forEach((d: any) => {
          if (d.isNode()) {
            _lc.addOrUpdateElem(
              d.id(),
              x,
              {
                position: getNodePosition(d),
                data: d.data(),
              },
              cy
            );
          } else if (d.isEdge()) {
            _lc.addOrUpdateElem(
              d.id(),
              x,
              {
                position: getEdgePosition(d),
                data: d.data(),
              },
              cy
            );
          }
        });
      });
    }

    function addCyHandler(ev: ICyEventObject, _cy: any) {
      const target = ev.target;
      const param = $$find(_params.slice().reverse(), (x) =>
        target.is(x.query)
      );
      if (param) {
        if (target.isNode()) {
          _lc.addOrUpdateElem(
            target.id(),
            param,
            {
              position: getNodePosition(target),
              data: target.data(),
            },
            _cy
          );
        } else if (target.isEdge()) {
          _lc.addOrUpdateElem(
            target.id(),
            param,
            {
              position: getEdgePosition(target),
              data: target.data(),
            },
            _cy
          );
        }
      }
    }

    function layoutstopHandler({ cy }: ICyEventObject) {
      _params.forEach((x) => {
        cy.elements(x.query).forEach((d: any) => {
          if (d.isNode()) {
            _lc.updateElemPosition(d.id(), getNodePosition(d));
          } else if (d.isEdge()) {
            _lc.updateElemPosition(d.id(), getEdgePosition(d));
          }
        });
      });
    }

    function removeCyHandler(ev: ICyEventObject) {
      _lc.removeElemById(ev.target.id());
    }

    function moveCyHandler(ev: ICyEventObject) {
      _lc.updateElemPosition(ev.target.id(), getNodePosition(ev.target));
      let edgesConnected = _cy.$('#' + ev.target.id()).connectedEdges();
      if (edgesConnected.length > 0) {
        edgesConnected.forEach((e: any) => {
          _lc.updateElemPosition(e.id(), getEdgePosition(e));
        });
      }
    }

    function updateDataOrStyleCyHandler(ev: ICyEventObject, _cy: any) {
      const target = ev.target;
      const param = $$find(_params.slice().reverse(), (x) =>
        target.is(x.query)
      );
      if (param && !target.removed()) {
        if (target.isNode()) {
          _lc.addOrUpdateElem(
            target.id(),
            param,
            {
              position: getNodePosition(target),
              data: target.data(),
            },
            _cy
          );
        } else if (target.isEdge()) {
          _lc.addOrUpdateElem(
            target.id(),
            param,
            {
              position: getEdgePosition(target),
              data: target.data(),
            },
            _cy
          );
        }
      } else {
        _lc.removeElemById(target.id());
      }
    }

    function wrapCyHandler({ cy }: ICyEventObject) {
      _lc.updatePanZoom({
        pan: cy.pan(),
        zoom: cy.zoom(),
      });
    }

    function getNodePosition(node: any): ICytoscapeNodeHtmlPosition {
      return {
        w: node.width(),
        h: node.height(),
        x: node.position('x'),
        y: node.position('y'),
      };
    }
    function getEdgePosition(edge: any): ICytoscapeNodeHtmlPosition {
      let obj;
      if (params && params[0]?.edgehtmlLocation) {
        if (params[0]?.edgehtmlLocation == 'start') {
          obj = {
            w: edge.width(),
            h: edge.height(),
            x: edge.sourceEndpoint().x,
            y: edge.sourceEndpoint().y,
          };
        } else if (params[0]?.edgehtmlLocation == 'end') {
          obj = {
            w: edge.width(),
            h: edge.height(),
            x: edge.targetEndpoint().x,
            y: edge.targetEndpoint().y,
          };
        } else {
          obj = {
            w: edge.width(),
            h: edge.height(),
            x: edge.midpoint().x,
            y: edge.midpoint().y,
          };
        }
      } else {
        obj = {
          w: edge.width(),
          h: edge.height(),
          x: edge.midpoint().x,
          y: edge.midpoint().y,
        };
      }
      return obj;
    }
  }

  // registers the extension on a cytoscape lib ref
  const register = function (cy: any) {
    if (!cy) {
      return;
    } // can't register if cytoscape unspecified

    cy('core', 'nodeHtmlLabel', function (optArr: any, options?: any) {
      return cyNodeHtmlLabel(this, optArr, options);
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    // expose as a commonjs module
    module.exports = function (cy: any) {
      register(cy);
    };
  } else {
    if (typeof define !== 'undefined' && define.amd) {
      // expose as an amd/requirejs module
      define('cytoscape-nodeHtmlLabel', function () {
        return register;
      });
    }
  }

  if (typeof cytoscape !== 'undefined') {
    // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape);
  }
})();
