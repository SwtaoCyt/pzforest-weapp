export interface Article {
  id: string;
  title: string;
  summary: string;
  cover: string | null;
  contentHtml: string;
  pubTime: string;
  source: string;
}
