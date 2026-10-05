export interface WheelDetail {
  images: string[];
  specs: {
    construction?: string;
    material?: string;
    sizes?: string;
    boltPattern?: string;
    finish?: string;
    madeIn?: string;
    centerCap?: string;
    styles?: string;
  };
  description?: string;
  gallery: string[];
  /** Finish / center-cap renders from Rucci's media library (phase 2 of scripts/fetch-rucci.js). */
  variants?: WheelVariant[];
  /** Photos of the wheel on customer cars, with the vehicle named. */
  vehicles?: { url: string; vehicle: string }[];
  isNew?: boolean;
  sourceUrl?: string;
}

export interface WheelVariant {
  finish: string;
  cap?: string;
  url: string;
}

export interface Wheel {
  name: string;
  series: string;
  imageUrl: string;
  slug: string;
  detail?: WheelDetail;
}

export interface QuoteFormData {
  wheelName: string;
  wheelImageUrl: string;
  name: string;
  email: string;
  phone: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  sizePreference: string;
  finishPreference: string;
  colorCode: string;
  centerCap: string;
  staggered: string;
  bigBrakes: string;
  needTires: string;
  message: string;
}
