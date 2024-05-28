declare type IHAlign = 'left' | 'center' | 'right';
declare type IVAlign = 'top' | 'center' | 'bottom';
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
