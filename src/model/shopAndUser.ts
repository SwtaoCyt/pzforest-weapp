export interface Shop {
    id: number;
    remark?: string;
    sellerOpenid: string;
    location: string[];
    price: number;
    bookIsbn?: string;
    productName: string;
    imageUrls: string[];
    createdAt: Date;
    disable?: boolean;
    buyerOpenid:string;
    buyerNickName:string;
    sellerNickname:string;
  }
  