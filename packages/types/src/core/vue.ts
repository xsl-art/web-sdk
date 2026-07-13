import { IAnyObject } from "./base";

export interface VueInstance {
  [key: string]: any; //vue实例属性和方法
  //config:VueConfiguration
  //version?:string
}

export interface VueConfiguration {
  monitor?: boolean; //是否监控vue事件
  errorHandler?(err: Error, vm: ViewModel, info: string): void;
  warnHandler?(msg: string, vm: ViewModel, trace: string): void;
  keyCode?: { [key: string]: number | Array<number> };
}

export interface ViewModel {
  [key: string]: any; //vue实例属性和方法(包括自定义)
  $root?: Record<string, unknown>; //vue实例根元素
  $options?: {
    //组件初始化选项
    [key: string]: any;
    name?: string; //组件名称
    propsData?: IAnyObject; //传入组件的props数据
    _componentTag?: string; //Vue 内部使用的组件标签标识
    __file?: string; //组件源码文件路径
    props?: IAnyObject; //组件定义的 props 配置
  };
  $props?: Record<string, unknown>; //当前组件接收到的 props 值
}
