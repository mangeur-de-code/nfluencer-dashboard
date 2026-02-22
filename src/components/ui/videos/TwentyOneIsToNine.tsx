interface TwentyOneIsToNineProps {
  videoUrl: string;
  title?: string;
}

export default function TwentyOneIsToNine({ videoUrl, title = "Video" }: TwentyOneIsToNineProps) {
  return (
    <div className="aspect-21/9 overflow-hidden rounded-lg">
      <iframe
        src={videoUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    </div>
  );
}
