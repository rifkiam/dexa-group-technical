import Button from './Button';

export default function ImageCapture() {
    return (
        <div>
            <video id="video" width="640" height="480" autoPlay></video>
            <Button id="capture">Capture</Button>
            <canvas id="canvas" width="640" height="480"></canvas>
            <Button id="download" variant="secondary">Download</Button>
        </div>
    )
}
