interface SixteenIsToNineProps {
  videoUrl: string;
  title?: string;
}

export default function SixteenIsToNine({ videoUrl, title = "Video" }: SixteenIsToNineProps) {
  return (
    <div className="aspect-4/3 overflow-hidden rounded-lg">
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
