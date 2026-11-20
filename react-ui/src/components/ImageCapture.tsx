export default function ImageCapture() {
    return (
        <div>
            <video id="video" width="640" height="480" autoPlay></video>
            <button id="capture">Capture</button>
            <canvas id="canvas" width="640" height="480"></canvas>
            <button id="download">Download</button>
        </div>
    )
}