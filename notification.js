const storage = require('node-persist');

class Notification {
    constructor(key) {
        this.key = key;

        storage.initSync();
        this.groups = new Set(storage.getItemSync(this.key));
    }

    register(msg) {
        console.log(`Registering ${msg.chat.id}`);
        this.groups.add(msg.chat.id);
        storage.setItem(this.key, Array.from(this.groups));
    }

    unregister(msg) {
        console.log(`Unregistering ${msg.chat.id}`);
        this.groups.delete(msg.chat.id);
        storage.setItem(this.key, Array.from(this.groups));
    }

    notifyAllGroups(message) {
        Array.from(this.groups).map((group) => this.notifyGroup(group, message));
    }

    notifyGroup(group, message) {
        throw new Error("This method should be implemented in subclasses");
    }
}

module.exports = Notification;
