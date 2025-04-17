
export function display_notification(type:string, content:string, timeout?: number) {
    const timeOutSecond = (timeout) ? timeout : 15000;
    dispatchEvent(new CustomEvent('ldNotificationClear'));
    
    dispatchEvent(new CustomEvent('ldNotificationAdd', {
        detail: { content: content, type: type },
    }));

    // Automatically dismiss the notification after a timeout
    setTimeout(() => {
        dispatchEvent(new CustomEvent('ldNotificationDismiss'));
    }, timeOutSecond);
}
