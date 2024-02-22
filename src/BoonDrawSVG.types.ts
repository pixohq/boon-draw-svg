export interface GetElementByIdOptions {
  qualifiedName?: string;
}

export interface GetFontStyleProps {
  fontSize: number;
  letterSpacing: number;
  scale: number;
}

export interface GetAdjustedFontSizeProps {
  document: Document;
  targetId: string;
  brandName: string;
}

export interface GetUpdatedBrandNameYProps {
  document: Document;
  targetId: string;
  brandName: string;
  fontSize: number;
}

export interface UpdateBrandNameProps {
  targetId: string;
  brandName: string;
}
