import type { IPadding } from '@visactor/vutils';
import type { ITextMark } from '../../mark/text';
import type { SeriesMarkMap } from '../interface';
import type { IWordCloudSeriesSpec, WordCloudConfigType, WordCloudShapeConfigType, WordCloudShapeType } from './interface';
import type { Datum, IPoint } from '../../typings';
import { BaseSeries } from '../base/base-series';
import type { IMark } from '../../mark/interface';
export type IBaseWordCloudSeriesSpec = Omit<IWordCloudSeriesSpec, 'type'> & {
    type: string;
};
export declare class BaseWordCloudSeries<T extends IBaseWordCloudSeriesSpec = IBaseWordCloudSeriesSpec> extends BaseSeries<T> {
    static readonly mark: SeriesMarkMap;
    protected _nameField: string;
    protected _valueField?: string;
    setValueField(field: string): void;
    protected _fontFamilyField: string;
    protected _fontWeightField: string;
    protected _fontStyleField: string;
    protected _colorHexField: string;
    protected _colorMode: 'linear' | 'ordinal';
    protected _colorList: string[];
    protected _rotateAngles?: number[];
    protected _fontWeightRange?: [number, number];
    protected _fontSizeRange?: [number, number];
    setFontSizeRange(fontSizeRange: [number, number]): void;
    protected _maskShape?: string | WordCloudShapeType;
    protected _isWordCloudShape: boolean;
    protected _keepAspect?: boolean;
    protected _random?: boolean;
    protected _fontPadding?: number;
    protected _fillingFontPadding?: number;
    protected _wordCloudConfig?: WordCloudConfigType;
    protected _wordCloudShapeConfig?: WordCloudShapeConfigType;
    protected _padding?: IPadding;
    setAttrFromSpec(): void;
    protected _wordMark: ITextMark;
    protected _fillingWordMark: ITextMark;
    initMark(): void;
    initMarkStyle(): void;
    protected initTooltip(): void;
    initAnimation(): void;
    protected getWordOrdinalColorScale(field: string, isFillingWord: boolean): any;
    getWordColorAttribute(field: string, isFillingWord: boolean): ((datum: Datum) => any) | {
        scale: any;
        field: string;
    };
    compile(): void;
    getStatisticFields(): {
        key: string;
        operations: Array<'max' | 'min' | 'values'>;
    }[];
    dataToPosition(data: Datum): IPoint;
    dataToPositionX(data: any): number;
    dataToPositionY(data: any): number;
    dataToPositionZ(data: any): number;
    valueToPosition(value1: any, value2?: any): IPoint;
    getGroupFields(): string[];
    getStackGroupFields(): string[];
    getStackValueField(): string;
    onLayoutEnd(ctx: any): void;
    getActiveMarks(): IMark[];
}