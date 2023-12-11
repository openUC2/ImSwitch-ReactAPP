import React from 'react';

class MJPEGStream extends React.Component {
    render() {
        return (
            <img
                src="http://192.168.2.223:8001/RecordingController/video_feeder"
                alt="MJPEG Stream"
                style={{ width: '100%' }}
            />
        );
    }
}
