'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function HelpPage() {
  const faqItems = [
    {
      id: "q1",
      question: "CardSyncとはどのようなサービスですか？",
      answer: "CardSyncは、名刺画像をGoogle Driveにアップロードし、AI-OCRで情報を抽出してGoogleスプレッドシートに整理・管理できるサービスです。名刺情報を効率的にデジタル化し、アクセスしやすくすることを目的としています。"
    },
    {
      id: "q2",
      question: "対応している名刺画像の形式は何ですか？",
      answer: "現在はJPEG形式 (.jpg, .jpeg) の画像ファイルに対応しています。PNG形式も一部対応していますが、JPEGを推奨します。"
    },
    {
      id: "q3",
      question: "名刺情報を編集・更新する方法は？",
      answer: "「名刺一覧」画面で、各名刺カードの編集アイコンをクリックすると、ファイル名やメモを編集できます。変更内容はGoogle Driveのファイル名とスプレッドシートに反映されます。"
    },
    {
      id: "q4",
      question: "Google DriveのフォルダIDとは何ですか？どこで確認できますか？",
      answer: "Google Driveで名刺画像を保存するフォルダを開いた際、ブラウザのアドレスバーに表示されるURLの末尾部分がフォルダIDです。例えば、URLが `https://drive.google.com/drive/folders/abcdef12345` の場合、`abcdef12345` がフォルダIDになります。"
    },
    {
      id: "q5",
      question: "GoogleスプレッドシートIDとは何ですか？どこで確認できますか？",
      answer: "名刺情報を記録するGoogleスプレッドシートを開いた際、ブラウザのアドレスバーに表示されるURLの中間部分がスプレッドシートIDです。例えば、URLが `https://docs.google.com/spreadsheets/d/ghijkl67890/edit` の場合、`ghijkl67890` がスプレッドシートIDになります。"
    },
    {
      id: "q6",
      question: "「画像表示エラー」と表示される場合はどうすれば良いですか？",
      answer: "Google Drive上で該当の画像ファイルが削除されていないか、ファイル名が変更されていないかご確認ください。また、CardSyncの設定画面でGoogle Driveとの連携が正しく行われているか、フォルダIDが正しいかご確認ください。問題が解決しない場合は、サポートまでお問い合わせください。"
    },
    {
      id: "q7",
      question: "OCRの精度はどのくらいですか？",
      answer: "OCRの精度は名刺のデザイン、フォント、画像の品質などによって変動します。可能な限り鮮明で歪みのない画像をご利用ください。抽出結果が不正確な場合は、スプレッドシート上で手動で修正いただけます。"
    },
    // 他のFAQ項目をここに追加
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">ヘルプセンター</h1>
        <p className="text-muted-foreground">
          CardSyncのご利用方法やよくあるご質問をまとめました。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>よくあるご質問 (FAQ)</CardTitle>
          <CardDescription>
            問題が解決しない場合は、サポートまでお問い合わせください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem value={item.id} key={item.id}>
                <AccordionTrigger className="text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                  <p>{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      
      {/* 必要に応じて、お問い合わせフォームや連絡先情報をここに追加 */}
      {/* <Separator className="my-8" />
      <Card>
        <CardHeader>
          <CardTitle>お問い合わせ</CardTitle>
        </CardHeader>
        <CardContent>
          <p>上記FAQで解決しない問題については、[サポートメールアドレス] までご連絡ください。</p>
        </CardContent>
      </Card> */}
    </div>
  );
}
