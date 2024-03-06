export interface GetAdjustedFontSizeProps {
  key: string;
  document: Document;
  targetId: string;
  brandName: string;
}

export interface GetAdjustedFontSizeResult {
  fontSize: number;
  letterSpacing: number;
}

export interface GetUpdatedBrandNameDyProps {
  key: string;
}

export interface GetUpdatedBrandNameYProps {
  key: string;
  document: Document;
  targetId: string;
  brandName: string;
  fontSize: number;
}

export interface UpdateBrandNameProps {
  key: string;
  targetId: string;
  brandName: string;
}
