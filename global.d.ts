//扩展浏览器原生Performance接口
declare interface Performance extends Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJsHeapSize: number;
    usedJsHeapSize: number;
  };
}

//允许导入json文件作为模块
declare module "*.json" {
  const value: any;
  export default value;
}

//自定义全局变量
declare interface Window {
  chrome?: {
    app: {
      [key: string]: any;
    };
  };
  __webSdk__: {
    [key: string]: any;
  };
}
