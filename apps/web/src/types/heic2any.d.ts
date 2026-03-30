declare module "heic2any" {
  interface Options {
    blob: Blob;
    multiple?: boolean;
    toType?: string;
    quality?: number;
    gifInterval?: number;
  }

  function heic2any(options: Options): Promise<Blob | Blob[]>;

  export default heic2any;
}
