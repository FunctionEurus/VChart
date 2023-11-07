import type { IModelEvaluateOption, IModelInitOption } from '../../model/interface';
import type { BoxPlotShaftShape, IOutlierMarkSpec, Maybe } from '../../typings';
import { CartesianSeries } from '../cartesian/cartesian';
import type { SeriesMarkMap } from '../interface';
import { SeriesTypeEnum } from '../interface/type';
import type { IBoxPlotSeriesSpec, IBoxPlotSeriesTheme } from './interface';
import { SeriesData } from '../base/series-data';
import type { IMark } from '../../mark/interface';
export declare const DEFAULT_FILL_COLOR = "#FFF";
export declare const DEFAULT_STROKE_COLOR = "#000";
export declare class BoxPlotSeries<T extends IBoxPlotSeriesSpec = IBoxPlotSeriesSpec> extends CartesianSeries<T> {
    static readonly type: string;
    type: SeriesTypeEnum;
    static readonly mark: SeriesMarkMap;
    protected _theme: Maybe<IBoxPlotSeriesTheme>;
    protected _minField: string;
    getMinField(): string;
    protected _maxField: string;
    getMaxField(): string;
    protected _q1Field: string;
    getQ1Field(): string;
    protected _medianField: string;
    getMedianField(): string;
    protected _q3Field: string;
    getQ3Field(): string;
    protected _outliersField: string;
    getOutliersField(): string;
    protected _lineWidth: number;
    protected _boxWidth: number;
    protected _shaftShape: BoxPlotShaftShape;
    getShaftShape(): BoxPlotShaftShape;
    protected _shaftWidth: number;
    protected _boxFillColor: string;
    getBoxFillColor(): string;
    protected _strokeColor: string;
    getStrokeColor(): string;
    protected _shaftFillOpacity: number;
    protected _outliersStyle: IOutlierMarkSpec;
    getOutliersStyle(): IOutlierMarkSpec;
    protected _outlierDataView: SeriesData;
    private _autoBoxWidth;
    setAttrFromSpec(): void;
    private _boxPlotMark?;
    private _outlierMark?;
    initMark(): void;
    initMarkStyle(): void;
    initBoxPlotMarkStyle(): void;
    initData(): void;
    init(option: IModelInitOption): void;
    private _getMarkWidth;
    onLayoutEnd(ctx: any): void;
    private _initAnimationSpec;
    initAnimation(): void;
    protected initTooltip(): void;
    getStatisticFields(): {
        key: string;
        operations: import("../../data/transforms/dimension-statistics").StatisticOperations;
    }[];
    onEvaluateEnd(ctx: IModelEvaluateOption): void;
    getDefaultShapeType(): string;
    getActiveMarks(): IMark[];
}
export declare const registerBoxplotSeries: () => void;