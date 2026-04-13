import Alert from '../models/alert.model.js';

const getMyAlerts = async (req, res) => {
    try {
        const userId = req.user.id;
        const alerts = await Alert.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, alerts });
    } catch (err) {
        console.error("Get Alerts Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await Alert.findByIdAndUpdate(id, { isRead: true }, { new: true });
        res.status(200).json({ success: true, alert });
    } catch (err) {
        console.error("Mark Read Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export default { getMyAlerts, markAsRead };
