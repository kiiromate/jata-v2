/**
 * @file Offline Queue Manager
 * @description Manages a queue of applications to be saved when connection is restored
 */
const QUEUE_KEY = 'jata_offline_queue';
const MAX_RETRY_COUNT = 3;
/**
 * Add an application to the offline queue
 */
export const addToQueue = async (application) => {
    const queue = await getQueue();
    const queuedApp = {
        ...application,
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
    };
    queue.push(queuedApp);
    await saveQueue(queue);
};
/**
 * Get the current offline queue
 */
export const getQueue = async () => {
    return new Promise((resolve) => {
        chrome.storage.local.get([QUEUE_KEY], (result) => {
            resolve(result[QUEUE_KEY] || []);
        });
    });
};
/**
 * Save the queue to storage
 */
const saveQueue = async (queue) => {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [QUEUE_KEY]: queue }, () => {
            resolve();
        });
    });
};
/**
 * Remove an item from the queue
 */
export const removeFromQueue = async (id) => {
    const queue = await getQueue();
    const updatedQueue = queue.filter(item => item.id !== id);
    await saveQueue(updatedQueue);
};
/**
 * Mark a queued item as failed and increment retry count
 */
export const markAsFailed = async (id) => {
    const queue = await getQueue();
    const item = queue.find(item => item.id === id);
    if (item) {
        item.retryCount++;
        // Remove if max retries exceeded
        if (item.retryCount >= MAX_RETRY_COUNT) {
            await removeFromQueue(id);
        }
        else {
            await saveQueue(queue);
        }
    }
};
/**
 * Get queue size
 */
export const getQueueSize = async () => {
    const queue = await getQueue();
    return queue.length;
};
/**
 * Clear the entire queue
 */
export const clearQueue = async () => {
    await saveQueue([]);
};
/**
 * Check if online
 */
export const isOnline = () => {
    return navigator.onLine;
};
/**
 * Process the offline queue (attempt to save all queued applications)
 */
export const processQueue = async (saveFn) => {
    if (!isOnline()) {
        return { success: 0, failed: 0 };
    }
    const queue = await getQueue();
    let successCount = 0;
    let failedCount = 0;
    for (const item of queue) {
        try {
            const success = await saveFn(item);
            if (success) {
                await removeFromQueue(item.id);
                successCount++;
            }
            else {
                await markAsFailed(item.id);
                failedCount++;
            }
        }
        catch (error) {
            console.error(`Failed to process queued item ${item.id}:`, error);
            await markAsFailed(item.id);
            failedCount++;
        }
    }
    return { success: successCount, failed: failedCount };
};
