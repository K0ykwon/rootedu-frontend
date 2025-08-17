interface Props {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: Props) {
  const { postId } = await params;
  
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-6">게시글 상세: {postId}</h1>
      <p className="text-gray-600">게시글 내용 및 댓글을 표시할 예정입니다.</p>
    </div>
  );
}