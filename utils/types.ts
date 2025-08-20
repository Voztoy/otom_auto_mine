export interface OtomTokenMetadata {
  name: string;
  image: string;
  chipImage: string;
  attributes: {
    trait_type: string;
    value: string | number | boolean;
  }[];
}
