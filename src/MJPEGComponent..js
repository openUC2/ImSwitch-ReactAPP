import React from 'react';

class MJPEGStream extends React.Component {
    render() {
        return (
            <img
                src="http://192.168.2.223/imswitch/api/RecordingController/video_feeder"
                alt="MJPEG Stream"
                style={{ width: '100%' }}
            />
        );
    }
}
