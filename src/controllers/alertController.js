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

const deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;
        await Alert.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Alert deleted" });
    } catch (err) {
        console.error("Delete Alert Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await Alert.updateMany({ userId, isRead: false }, { isRead: true });
        res.status(200).json({ success: true, message: "All alerts marked as read" });
    } catch (err) {
        console.error("Mark All Read Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export default { getMyAlerts, markAsRead, deleteAlert, markAllAsRead };
