import request from '../utils/request';

/**
 * 消息查询参数
 */
export interface MessageQueryParams {
  page?: number;
  pageSize?: number;
  type?: string; // stage_reminder, audit_result, ae_alert, system_notice
  isRead?: boolean;
}

/**
 * 消息详情
 */
export interface MessageDetail {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  data?: {
    navigateTo?: string;
    patientId?: number;
    aeId?: number;
    stage?: string;
    [key: string]: any;
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 消息列表响应
 */
export interface MessageListResponse {
  data: MessageDetail[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 未读消息数量响应
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * 获取我的消息列表
 */
export const getMyMessages = (params: MessageQueryParams = {}) => {
  return request.get<MessageListResponse>('/push-messages/my-messages', params);
};

/**
 * 获取未读消息数量
 */
export const getUnreadCount = () => {
  return request.get<UnreadCountResponse>('/push-messages/unread-count');
};

/**
 * 标记消息为已读
 */
export const markAsRead = (messageIds: number[]) => {
  return request.post('/push-messages/mark-as-read', { messageIds });
};

/**
 * 标记所有消息为已读
 */
export const markAllAsRead = () => {
  return request.post('/push-messages/mark-all-as-read');
};

/**
 * 获取消息详情
 */
export const getMessageDetail = (id: number) => {
  return request.get<MessageDetail>(`/push-messages/${id}`);
};

/**
 * 删除消息
 */
export const deleteMessage = (id: number) => {
  return request.delete(`/push-messages/${id}`);
};
