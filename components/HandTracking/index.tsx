// HandTracking.tsx
import { useEffect, useRef, useCallback } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Hands } from "@mediapipe/hands";

interface HandTrackingProps {
  setHandPosition: (x: number, y: number) => void;
}

export const HandTracking: React.FC<HandTrackingProps> = ({
  setHandPosition,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      if (!ctx || !canvasRef.current) return;

      // Clear the canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.multiHandLandmarks?.length > 0) {
        const hand = results.multiHandLandmarks[0];
        const palmX = hand[0].x;
        const palmY = hand[0].y;

        // Update hand position for the cube
        setHandPosition((palmX - 0.5) * 2, -(palmY - 0.5) * 2);

        // Draw bounding box
        const minX =
          Math.min(...hand.map((point) => point.x)) * canvasRef.current.width;
        const maxX =
          Math.max(...hand.map((point) => point.x)) * canvasRef.current.width;
        const minY =
          Math.min(...hand.map((point) => point.y)) * canvasRef.current.height;
        const maxY =
          Math.max(...hand.map((point) => point.y)) * canvasRef.current.height;

        // Draw rectangle
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(minX, minY, maxX - minX, maxY - minY);
        ctx.stroke();

        // Draw landmarks
        ctx.fillStyle = "#00FF00";
        hand.forEach((point) => {
          ctx.beginPath();
          ctx.arc(
            point.x * canvasRef.current!.width,
            point.y * canvasRef.current!.height,
            3,
            0,
            2 * Math.PI
          );
          ctx.fill();
        });
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, [setHandPosition]);

  return (
    <div className="absolute top-6 left-6 w-[300px] aspect-[4/3]">
      <video
        ref={videoRef}
        className="absolute top-0 right-0 w-full h-full object-cover rounded-lg"
        style={{ transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute top-0 right-0 w-full h-full rounded-lg"
        style={{ transform: "scaleX(-1)" }}
      />
    </div>
  );
};
