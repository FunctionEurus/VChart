import type { IGroupMark, IMark, MarkAnimationSpec, MarkFunctionCallback, Nil, TransformSpec } from '@visactor/vgrammar-core';
import type { DataView } from '@visactor/vdataset';
import { GrammarItem } from '../grammar-item';
import type { Maybe, StringOrNumber } from '../../typings';
import type { IMarkProgressiveConfig, IMarkStateStyle, MarkType } from '../../mark/interface';
import type { IModel } from '../../model/interface';
import { MarkStateManager } from './mark-state-manager';
import type { ICompilableMark, IMarkDataInitOption, ICompilableMarkOption, StateValueType, IMarkCompileOption, IAttributeOpt } from './interface';
import { MarkData } from './mark-data';
import { GrammarType } from '../interface/compilable-item';
import type { IEvent } from '../../event/interface';
import type { ILabelSpec } from '../../component/label';
export declare abstract class CompilableMark extends GrammarItem implements ICompilableMark {
    readonly grammarType = GrammarType.mark;
    readonly type: MarkType;
    readonly name: string;
    readonly key: ICompilableMark['key'];
    protected _support3d?: boolean;
    getSupport3d(): boolean;
    setSupport3d(support3d: boolean): void;
    protected _facet?: string;
    getFacet(): string;
    setFacet(facet: string): void;
    protected _interactive: boolean;
    getInteractive(): boolean;
    setInteractive(interactive: boolean): void;
    protected _zIndex: number;
    getZIndex(): number;
    setZIndex(zIndex: number): void;
    protected _visible: boolean;
    getVisible(): boolean;
    setVisible(visible: boolean): void;
    protected _userId: StringOrNumber;
    getUserId(): StringOrNumber;
    setUserId(userId: StringOrNumber): void;
    readonly model: IModel;
    protected _data: Maybe<MarkData>;
    getDataView(): DataView | undefined;
    setDataView(d?: DataView, productId?: string): void;
    getData(): MarkData;
    setData(d?: MarkData): void;
    stateStyle: IMarkStateStyle<any>;
    state: MarkStateManager;
    protected _unCompileChannel: {
        [key in string]: boolean;
    };
    hasState(state: string): boolean;
    getState(state: string): unknown;
    protected _event: IEvent;
    protected _animationConfig: Partial<MarkAnimationSpec>;
    getAnimationConfig(): Partial<MarkAnimationSpec>;
    setAnimationConfig(config: Partial<MarkAnimationSpec>): void;
    private _skipBeforeLayouted;
    setSkipBeforeLayouted(skip: boolean): void;
    getSkipBeforeLayouted(): boolean;
    protected _morph: boolean;
    getMorph(): boolean;
    setMorph(morph: boolean): void;
    protected _morphKey?: string;
    getMorphKey(): string;
    setMorphKey(morphKey: string): void;
    protected _morphElementKey?: string;
    getMorphElementKey(): string;
    setMorphElementKey(key: string): void;
    protected _groupKey?: string;
    getGroupKey(): string;
    setGroupKey(groupKey: string): void;
    protected _label?: ILabelSpec[];
    getLabelSpec(): ILabelSpec[];
    setLabelSpec(label: ILabelSpec | ILabelSpec[]): void;
    addLabelSpec(label: ILabelSpec): void;
    protected _progressiveConfig: IMarkProgressiveConfig;
    getProgressiveConfig(): IMarkProgressiveConfig;
    setProgressiveConfig(config: IMarkProgressiveConfig): void;
    protected _option: ICompilableMarkOption;
    constructor(option: ICompilableMarkOption, name: string, model: IModel);
    protected _product: Maybe<IMark>;
    getProduct: () => Maybe<IMark>;
    protected _transform: TransformSpec[] | Nil;
    setTransform(transform: TransformSpec[] | Nil): void;
    protected initMarkData(option: IMarkDataInitOption): void;
    protected stateKeyToSignalName(key: string): string;
    getAttribute(key: any, datum: any, state: StateValueType, opt?: IAttributeOpt): void;
    protected _compileProduct(option?: IMarkCompileOption): void;
    protected _initProduct(group?: string | IGroupMark): void;
    generateProductId(): string;
    compileData(): void;
    updateStaticEncode(): void;
    protected _separateStyle(): {
        enterStyles: Record<string, any>;
        updateStyles: Record<string, any>;
    };
    compileEncode(): void;
    compileState(): void;
    compileAnimation(): void;
    compileContext(): void;
    compileSignal(): void;
    protected compileCommonAttributeCallback(key: string, state: string): MarkFunctionCallback<any>;
    protected compileTransform(): void;
    protected _lookupGrammar(id: string): IMark;
    updateState(newState: Record<string, unknown>, noRender?: boolean): Promise<any>;
    updateLayoutState(noRender?: boolean, recursion?: boolean): Promise<void>;
    updateMarkState(key: string): void;
    getMarks(): ICompilableMark[];
    runAnimationByState(state?: string): import("@visactor/vgrammar-core").IAnimateArranger;
    stopAnimationByState(state?: string): import("@visactor/vgrammar-core").IAnimate;
    pauseAnimationByState(state?: string): import("@visactor/vgrammar-core").IAnimate;
    resumeAnimationByState(state?: string): import("@visactor/vgrammar-core").IAnimate;
    release(): void;
}