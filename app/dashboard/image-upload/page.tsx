import ImageUploadForm from '@/components/dashboard/image-upload-form'; // 次に作成

export default function ImageUploadPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">
        新規名刺 画像アップロード
      </h1>
      <ImageUploadForm />
    </div>
  );
}
