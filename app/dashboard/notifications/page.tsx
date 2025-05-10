'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BellRing } from "lucide-react";

export default function NotificationsPage() {
  // 将来的にはAPIからお知らせを取得する
  const notifications: any[] = []; // 仮の空配列

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">お知らせ</h1>
        {/* <Button size="sm">すべて既読にする</Button> */}
      </div>

      {notifications.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <BellRing className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">新しいお知らせはありません</h3>
            <p className="text-sm text-muted-foreground">
              重要な更新情報やメンテナンス情報はこちらに表示されます。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* {notifications.map((notification) => (
            <Card key={notification.id}>
              <CardHeader>
                <CardTitle>{notification.title}</CardTitle>
                <CardDescription>{new Date(notification.date).toLocaleDateString('ja-JP')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{notification.content}</p>
              </CardContent>
            </Card>
          ))} */}
        </div>
      )}
    </div>
  );
}
