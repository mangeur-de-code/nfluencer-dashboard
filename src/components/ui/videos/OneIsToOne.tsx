interface OneIsToOneProps {
  videoUrl: string;
  title?: string;
}

export default function OneIsToOne({ videoUrl, title = "Video" }: OneIsToOneProps) {
  return (
    <div className="overflow-hidden rounded-lg aspect-square">
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
