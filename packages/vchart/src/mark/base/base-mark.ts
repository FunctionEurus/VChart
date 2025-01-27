import type { IStateInfo, IAttributeOpt, IModelMarkAttributeContext } from '../../compile/mark/interface';
import type { BaseSeries } from '../../series/base/base-series';
import type {
  Datum,
  IMarkSpec,
  ConvertToMarkStyleSpec,
  GradientStop,
  IVisual,
  IVisualScale,
  IVisualSpecStyle,
  ICommonSpec,
  FunctionType,
  ValueType
} from '../../typings';
import { mergeSpec } from '@visactor/vutils-extension';
import { Color } from '../../util/color';
import { createScaleWithSpec } from '../../util/scale';
import type {
  IMarkRaw,
  IMarkStateStyle,
  IMarkStyle,
  IMark,
  IMarkOption,
  StyleConvert,
  VisualScaleType,
  MarkInputStyle
} from '../interface';
import { AttributeLevel, GradientType, DEFAULT_GRADIENT_CONFIG } from '../../constant';
import { isValidScaleType } from '@visactor/vscale';
import { computeActualDataScheme, getDataScheme } from '../../theme/color-scheme/util';
import type { ISeries } from '../../series/interface';
import { CompilableMark } from '../../compile/mark/compilable-mark';
import type { StateValueType } from '../../compile/mark';
import { degreeToRadian, isBoolean, isFunction, isNil, isValid } from '@visactor/vutils';

export type ExChannelCall = (
  key: string | number | symbol,
  datum: Datum,
  states: StateValueType,
  opt: unknown,
  baseValue: unknown
) => unknown;

export class BaseMark<T extends ICommonSpec> extends CompilableMark implements IMarkRaw<T> {
  declare stateStyle: IMarkStateStyle<T>;

  protected declare _option: IMarkOption;

  protected _attributeContext: IModelMarkAttributeContext;

  /** by _unCompileChannel, some channel need add default channel to make sure update available */
  _extensionChannel: {
    [key: string | number | symbol]: string[];
  } = {};
  /** same as _extensionChannel. when compute channel, add extension channel effect */
  _computeExChannel: {
    [key: string | number | symbol]: ExChannelCall;
  } = {};

  constructor(name: string, option: IMarkOption) {
    super(option, name, option.model);
    // 这里的上下文多数情况下与 mark 是什么是没有关系的，与mark的使用者，也就是series，component有的逻辑有关。
    this._attributeContext = option.attributeContext;
    option.map?.set(this.id, this as unknown as IMark);
  }

  created(): void {
    this._initStyle();
  }

  /**
   * 外部调用，根据 spec 初始化 style（如果由 IModel 派生类调用，请使用 IModel.initMarkStyleWithSpec）
   * @param spec
   * @param key
   * @returns
   */
  initStyleWithSpec(spec: IMarkSpec<T>, key?: string) {
    if (!spec) {
      return;
    }

    if (isValid(spec.id)) {
      this._userId = spec.id;
    }

    // interactive
    if (isBoolean(spec.interactive)) {
      this._interactive = spec.interactive;
    }
    // zIndex
    if (isValid(spec.zIndex)) {
      this.setZIndex(spec.zIndex);
    }
    // visible
    if (isBoolean(spec.visible)) {
      this.setVisible(spec.visible);
    }
    // style
    this._initSpecStyle(spec, this.stateStyle, key);
  }

  protected _transformStyleValue<T>(
    styleConverter: StyleConvert<T>,
    transform: (value: ValueType<T>) => ValueType<T>
  ): StyleConvert<any> {
    if ((styleConverter as VisualScaleType).scale) {
      const scale = (styleConverter as VisualScaleType).scale;
      const range = scale.range();
      scale.range(range.map(transform));
      return styleConverter as StyleConvert<T>;
    } else if (typeof styleConverter === 'function') {
      return ((...args) => {
        return transform((styleConverter as FunctionType<number>)(...args) as ValueType<T>);
      }) as StyleConvert<T>;
    }
    return transform(styleConverter as ValueType<T>);
  }

  convertAngleToRadian(styleConverter: StyleConvert<number>) {
    // 用户传入的角度配置，需要做一层转换
    return this._transformStyleValue(styleConverter, degreeToRadian);
  }

  isUserLevel(level: number) {
    return [AttributeLevel.User_Mark, AttributeLevel.User_Series, AttributeLevel.User_Chart].includes(level);
  }

  /**
   * 由外部series调用，设置markStyle的接口（如果由 IModel 派生类调用，请使用 IModel.setMarkStyle）
   * @param style
   * @param level
   * @param state
   */
  setStyle<U extends keyof T>(
    style: Partial<IMarkStyle<T>>,
    state: StateValueType = 'normal',
    level: number = 0,
    stateStyle = this.stateStyle
  ): void {
    if (isNil(style)) {
      return;
    }

    if (stateStyle[state] === undefined) {
      stateStyle[state] = {};
    }

    const isUserLevel = this.isUserLevel(level);

    Object.keys(style).forEach((attr: string) => {
      let attrStyle = style[attr] as MarkInputStyle<T[U]>;
      if (isNil(attrStyle)) {
        return;
      }

      attrStyle = this._filterAttribute(attr as any, attrStyle, state, level, isUserLevel, stateStyle);

      this.setAttribute(attr as any, attrStyle, state, level, stateStyle);
    });
  }

  getStyle(key: string, state: StateValueType = 'normal'): any {
    return this.stateStyle[state][key]?.style;
  }

  /** 过滤单个 attribute */
  protected _filterAttribute<U extends keyof T>(
    attr: U,
    style: MarkInputStyle<T[U]>,
    state: StateValueType,
    level: number,
    isUserLevel: boolean,
    stateStyle = this.stateStyle
  ): StyleConvert<T[U]> {
    let newStyle = this._styleConvert(style);
    if (isUserLevel) {
      switch (attr) {
        case 'angle':
          newStyle = this.convertAngleToRadian(newStyle);
          break;
        case 'innerPadding':
        case 'outerPadding':
          // VRender 的 padding 定义基于 centent-box 盒模型，默认正方向是向外扩，与 VChart 不一致。这里将 padding 符号取反
          newStyle = this._transformStyleValue(newStyle, (value: number) => -value);
          break;
      }
    }
    return newStyle;
  }

  /**
   * TODO: 没有外部调用
   * 设置mark样式所参考的图元
   */
  setReferer<U extends keyof T>(mark: IMarkRaw<T>, styleKey?: U, state?: StateValueType, stateStyle = this.stateStyle) {
    if (!mark) {
      return;
    }
    if (styleKey && state) {
      const style = stateStyle[state] ?? { [styleKey]: {} };
      stateStyle[state][styleKey] = {
        ...(style[styleKey] as unknown as any),
        ...{ referer: mark }
      };
      return;
    }

    Object.entries(stateStyle).forEach(([state, style]) => {
      Object.entries(style).forEach(([styleKey, style]) => {
        stateStyle[state][styleKey].referer = mark;
      });
    });
  }

  setPostProcess<U extends keyof T>(key: U, postProcessFunc: any, state: StateValueType = 'normal') {
    if (this.stateStyle[state]?.[key]) {
      this.stateStyle[state][key].postProcess = postProcessFunc;
    }
  }

  getAttribute<U extends keyof T>(key: U, datum: Datum, state: StateValueType = 'normal', opt?: IAttributeOpt) {
    return this._computeAttribute(key, state)(datum, opt);
  }

  setAttribute<U extends keyof T>(
    attr: U,
    style: MarkInputStyle<T[U]>,
    state: StateValueType = 'normal',
    level: number = 0,
    stateStyle = this.stateStyle
  ) {
    if (stateStyle[state] === undefined) {
      stateStyle[state] = {};
    }

    if (stateStyle[state][attr] === undefined) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      stateStyle[state][attr] = {
        level,
        style,
        referer: undefined
      };
    }
    const attrLevel = stateStyle[state][attr]?.level;
    if (isValid(attrLevel) && attrLevel <= level) {
      mergeSpec(stateStyle[state][attr], { style, level });
    }

    // some attr has extension channel in VChart to make some effect
    if (state !== 'normal') {
      if (attr in this._extensionChannel) {
        this._extensionChannel[attr].forEach(key => {
          if (stateStyle[state][key] === undefined) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            stateStyle[state][key as keyof T] = stateStyle.normal[key];
          }
        });
      }
    }
  }

  /**
   * 与 vgrammar 默认值一致的样式可以不设置默认值或设置为undefined, 减少encode属性
   */
  protected _getDefaultStyle() {
    return {
      visible: true,
      // mark的层级应该在mark层 不在encode属性层
      // zIndex: LayoutZIndex.Mark,
      x: 0,
      y: 0
    } as IMarkStyle<T>;
  }

  // /**
  //  * 获取该 mark 不支持的图形属性，由子类覆写
  //  * @returns
  //  */
  // protected getIgnoreAttributes(): string[] {
  //   return [];
  // }

  protected _styleConvert<U extends keyof T>(style?: MarkInputStyle<T[U]>): StyleConvert<T[U]> | undefined {
    if (!style) {
      return style as undefined;
    }
    // visual spec 转换为 scale 类型的mark style
    if (isValidScaleType((style as IVisualSpecStyle<unknown, T[U]>).type) || (style as IVisualScale).scale) {
      // const _style = style as IVisual<T[U]>;
      const scale = createScaleWithSpec(style as IVisual<T[U]>, {
        globalScale: this._option.globalScale,
        seriesId: this._option.seriesId
      });
      if (scale) {
        return {
          scale,
          field: (style as IVisual<T[U]>).field,
          changeDomain: (style as IVisualScale).changeDomain
        };
      }
    }
    return style as StyleConvert<T[U]>;
  }

  protected _computeAttribute<U extends keyof T>(key: U, state: StateValueType) {
    let stateStyle = this.stateStyle[state]?.[key];
    if (!stateStyle) {
      stateStyle = this.stateStyle.normal[key];
    }
    const baseValueFunctor = this._computeStateAttribute(stateStyle, key, state);
    const hasPostProcess = isFunction(stateStyle?.postProcess);
    const hasExCompute = key in this._computeExChannel;

    if (hasPostProcess && hasExCompute) {
      const exCompute = this._computeExChannel[key];
      return (datum: Datum, opt: IAttributeOpt) => {
        let baseValue = baseValueFunctor(datum, opt);

        baseValue = stateStyle.postProcess(baseValue, datum, this._attributeContext, opt, this.getDataView());

        return exCompute(key, datum, state, opt, baseValue);
      };
    } else if (hasPostProcess) {
      return (datum: Datum, opt: IAttributeOpt) => {
        return stateStyle.postProcess(
          baseValueFunctor(datum, opt),
          datum,
          this._attributeContext,
          opt,
          this.getDataView()
        );
      };
    } else if (hasExCompute) {
      const exCompute = this._computeExChannel[key];
      return (datum: Datum, opt: IAttributeOpt) => {
        return exCompute(key, datum, state, opt, baseValueFunctor(datum, opt));
      };
    }
    return baseValueFunctor;
  }

  protected _computeStateAttribute<U extends keyof T>(stateStyle: any, key: U, state: StateValueType) {
    if (!stateStyle) {
      return (datum: Datum, opt: IAttributeOpt) => undefined as any;
    }
    if (stateStyle.referer) {
      return stateStyle.referer._computeAttribute(key, state);
    }
    if (!stateStyle.style) {
      return (datum: Datum, opt: IAttributeOpt) => stateStyle.style;
    }

    if (typeof stateStyle.style === 'function') {
      return (datum: Datum, opt: IAttributeOpt) =>
        stateStyle.style(datum, this._attributeContext, opt, this.getDataView());
    }

    if (GradientType.includes(stateStyle.style.gradient)) {
      // 渐变色处理，支持各个属性回调
      return this._computeGradientAttr(stateStyle.style);
    }

    if (['outerBorder', 'innerBorder'].includes(key as string)) {
      // 内外描边处理，支持各个属性回调
      return this._computeBorderAttr(stateStyle.style);
    }

    if (isValidScaleType(stateStyle.style.scale?.type)) {
      return (datum: Datum, opt: IAttributeOpt) => stateStyle.style.scale.scale(datum[stateStyle.style.field]);
    }
    return (datum: Datum, opt: IAttributeOpt) => {
      return stateStyle.style;
    };
  }

  private _initStyle(): void {
    const defaultStyle = this._getDefaultStyle();
    this.setStyle(defaultStyle, 'normal', 0);
  }

  private _initSpecStyle(spec: IMarkSpec<T>, stateStyle: IMarkStateStyle<T>, key?: string) {
    // style
    if (spec.style) {
      this.setStyle(spec.style, 'normal', AttributeLevel.User_Mark, stateStyle);
    }
    const state = spec.state;
    if (state) {
      Object.keys(state).forEach(key => {
        const stateTemp = state[key];
        if ('style' in stateTemp) {
          const style = stateTemp.style;
          let stateInfo: IStateInfo = { stateValue: key };
          if ('level' in stateTemp) {
            stateInfo.level = stateTemp.level as number;
          }
          if ('filter' in stateTemp) {
            if (isFunction(stateTemp.filter)) {
              stateInfo = {
                filter: stateTemp.filter as (datum: any, options: Record<string, any>) => boolean,
                ...stateInfo
              };
            } else {
              stateInfo = { ...stateTemp.filter, ...stateInfo };
            }
          }
          this.state.addStateInfo(stateInfo);
          this.setStyle(style as ConvertToMarkStyleSpec<T>, key, AttributeLevel.User_Mark, stateStyle);
        } else {
          this.setStyle(stateTemp, key, AttributeLevel.User_Mark, stateStyle);
        }
      });
    }
  }

  private _computeGradientAttr(gradientStyle: any) {
    const { gradient, scale, field, ...rest } = gradientStyle;

    let colorScale = scale;
    let colorField = field;
    if ((!scale || !field) && this.model.modelType === 'series') {
      // 目前只有series有这个属性
      const { scale: globalColorScale, field: globalField } = (this.model as BaseSeries<any>).getColorAttribute();
      if (!scale) {
        // 获取全局的 colorScale
        colorScale = globalColorScale;
      }
      if (!colorField) {
        colorField = globalField;
      }
    }

    const themeColor = computeActualDataScheme(
      getDataScheme(
        this.model.getColorScheme(),
        this.model.modelType === 'series' ? this.model.getSpec?.() : undefined
      ),
      (this.model as ISeries).getDefaultColorDomain()
    );
    // 默认配置处理
    const mergedStyle = {
      ...DEFAULT_GRADIENT_CONFIG[gradient],
      ...rest
    };
    return (data: Datum, opt: IAttributeOpt) => {
      const computeStyle: any = {};
      const markData = this.getDataView();
      Object.keys(mergedStyle).forEach(key => {
        const value = mergedStyle[key];
        if (key === 'stops') {
          computeStyle.stops = value.map((stop: GradientStop) => {
            const { opacity, color, offset } = stop;
            let computeColor = color ?? colorScale?.scale(data[colorField]);
            if (isFunction(color)) {
              computeColor = color(data, this._attributeContext, opt, markData);
            }

            if (isValid(opacity)) {
              computeColor = Color.SetOpacity(computeColor as string, opacity);
            }

            return {
              offset: isFunction(offset) ? offset(data, this._attributeContext, opt, markData) : offset,
              color: computeColor || themeColor[0]
            };
          });
        } else if (isFunction(value)) {
          computeStyle[key] = value(data, this._attributeContext, opt, markData);
        } else {
          computeStyle[key] = value;
        }
      });

      computeStyle.gradient = gradient;

      return computeStyle;
    };
  }

  private _computeBorderAttr(borderStyle: any) {
    const { scale, field, ...mergedStyle } = borderStyle;

    return (data: Datum, opt: IAttributeOpt) => {
      const computeStyle: any = {};

      Object.keys(mergedStyle).forEach(key => {
        const value = mergedStyle[key];
        if (isFunction(value)) {
          computeStyle[key] = value(data, this._attributeContext, opt, this.getDataView());
        } else {
          computeStyle[key] = value;
        }
      });
      if (!('stroke' in computeStyle)) {
        const themeColor = computeActualDataScheme(
          getDataScheme(
            this.model.getColorScheme(),
            this.model.modelType === 'series' ? this.model.getSpec?.() : undefined
          ),
          (this.model as ISeries).getDefaultColorDomain()
        );
        let colorScale = scale;
        let colorField = field;
        if ((!scale || !field) && this.model.modelType === 'series') {
          // 目前只有series有这个属性
          const { scale: globalColorScale, field: globalField } = (this.model as BaseSeries<any>).getColorAttribute();
          if (!scale) {
            // 获取全局的 colorScale
            colorScale = globalColorScale;
          }
          if (!colorField) {
            colorField = globalField;
          }
          computeStyle.stroke = colorScale?.scale(data[colorField]) || themeColor[0];
        }
      } else if (GradientType.includes(mergedStyle.stroke?.gradient)) {
        computeStyle.stroke = this._computeGradientAttr(mergedStyle.stroke)(data, opt);
      }
      return computeStyle;
    };
  }
}
