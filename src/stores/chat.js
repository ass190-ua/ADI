import { defineStore } from 'pinia';
import { pb } from '../services/pb.js';
import { useAuthStore } from './auth.js';

/**
 * Chat store
 *
 * This store manages everything related to the messaging subsystem:
 * - Friends and friendship requests
 * - Conversations (private and group)
 * - Messages within a conversation
 *
 * It exposes convenient actions to fetch and mutate these resources via
 * PocketBase.  See FriendsView.vue and ChatsView.vue for usage examples.
 */
export const useChatStore = defineStore('chat', {
  state: () => ({
    /** Array of friend user models (users with accepted requests) */
    friends: [],
    /** Array of pending friend request records addressed to the current user */
    friendRequests: [],
    /** Array of conversation records the current user participates in */
    conversations: [],
    /**
     * Map of conversationId → array of message records.
     * Each message record includes an `expand.sender` with user details (if available).
     */
    messages: {},
    /** ID of the currently selected conversation */
    currentConversationId: null,
    /** Loading flag for async operations */
    loading: false,
    /** Last error message */
    error: null
  }),
  actions: {
    /**
     * Fetch all accepted friendships for the current user.
     * Friendships are represented by friend_requests with status="accepted".
     */
    async fetchFriends() {
      const auth = useAuthStore();
      const userId = auth.user?.id;
      if (!userId) return;
      try {
        const records = await pb.collection('friend_requests').getFullList({
          filter: `(sender="${userId}" && status="accepted") || (recipient="${userId}" && status="accepted")`,
          expand: 'sender,recipient'
        });
        // Map each record to the other user (friend)
        this.friends = records.map((r) => {
          // In the record the sender/recipient fields hold IDs, not expand; `expand` contains the full user objects
          const friend =
            r.sender === userId ? r.expand?.recipient : r.expand?.sender;
          return friend;
        });
      } catch (err) {
        console.error('Error fetching friends:', err);
        this.error = 'Error obteniendo amigos';
      }
    },

    // Dentro de defineStore('chat', { state, actions, ... })
    async searchUsers(q, page = 1, perPage = 10) {
      const meId = pb.authStore.model?.id || '';
      const safe = (q || '').replace(/"/g, '\\"').trim();

      // Construye el filtro SIN usar @request en el lado cliente
      const buildFilter = (requireVerified) => {
        const parts = [];

        if (meId) {
          parts.push(`id != "${meId}"`);              // ← excluirte a ti mismo
        }
        if (requireVerified) {
          parts.push('verified = true');              // ← solo verificados
        }
        if (safe) {
          // ?~ = búsqueda laxa (substring, case-insensitive)
          parts.push(`(name ?~ "${safe}" || username ?~ "${safe}" || email ?~ "${safe}")`);
        }
        return parts.join(' && ') || 'true';
      };

      // 1) Intento estricto: solo verificados
      let filter = buildFilter(true);
      let res = await pb.collection('users').getList(page, perPage, {
        filter,
        sort: 'name,username',
        fields: 'id,name,username,avatar,email,emailVisibility,verified,created'
      });

      // 2) Fallback dev: si no hay resultados, reintentar sin verified=true
      if (res.totalItems === 0 && safe) {
        filter = buildFilter(false);
        res = await pb.collection('users').getList(page, perPage, {
          filter,
          sort: 'name,username',
          fields: 'id,name,username,avatar,email,emailVisibility,verified,created'
        });
      }

      return {
        items: res.items,
        page: res.page,
        perPage: res.perPage,
        totalItems: res.totalItems,
        totalPages: res.totalPages,
      };
    },

    /**
     * Fetch all pending friend requests directed to the current user.
     */
    async fetchFriendRequests() {
      const auth = useAuthStore();
      const userId = auth.user?.id;
      if (!userId) return;
      try {
        const records = await pb.collection('friend_requests').getFullList({
          filter: `recipient="${userId}" && status="pending"`,
          expand: 'sender'
        });
        this.friendRequests = records;
      } catch (err) {
        console.error('Error fetching friend requests:', err);
        this.error = 'Error obteniendo solicitudes';
      }
    },

    /**
     * Send a friend request to another user identified either by their id or username.
     * Avoids sending duplicates by checking existing requests.
     * @param {string} userIdOrUsername The ID or username of the desired friend
     */
    async sendFriendRequest(userIdOrUsername) {
      const auth = useAuthStore();
      const myId = auth.user?.id;
      if (!myId) return;
      try {
        // Resolve the recipient's ID
        let recipientId = null;
        // simple heuristic: PocketBase user IDs are 15 characters long,
        // whereas usernames are free‑form. Adjust if your IDs differ.
        if (/^[a-zA-Z0-9]{15}$/.test(userIdOrUsername)) {
          recipientId = userIdOrUsername;
        } else {
          const target = await pb
            .collection('users')
            .getFirstListItem(`username="${userIdOrUsername}"`);
          recipientId = target.id;
        }
        // Check for existing request or friendship between these two users
        const existing = await pb
          .collection('friend_requests')
          .getFirstListItem(
            `(sender="${myId}" && recipient="${recipientId}") || (sender="${recipientId}" && recipient="${myId}")`,
            { $autoCancel: false }
          )
          .catch(() => null);
        if (existing) {
          throw new Error(
            'Ya existe una solicitud o amistad con este usuario.'
          );
        }
        await pb.collection('friend_requests').create({
          sender: myId,
          recipient: recipientId,
          status: 'pending'
        });
        await this.fetchFriendRequests();
      } catch (err) {
        console.error('Error sending friend request:', err);
        this.error = err?.message || 'Error enviando solicitud';
      }
    },

    /**
     * Accept or reject a friend request.
     * After responding, the lists are refreshed.
     * @param {string} requestId The record ID of the friend_request
     * @param {boolean} accept Whether to accept (true) or reject (false) the request
     */
    async respondFriendRequest(requestId, accept = true) {
      try {
        await pb.collection('friend_requests').update(requestId, {
          status: accept ? 'accepted' : 'rejected'
        });
        await this.fetchFriendRequests();
        if (accept) {
          await this.fetchFriends();
        }
      } catch (err) {
        console.error('Error responding to friend request:', err);
        this.error = 'Error actualizando solicitud';
      }
    },

    /**
     * Fetch all conversations that include the current user.
     */
    async fetchConversations() {
      const auth = useAuthStore();
      const userId = auth.user?.id;
      if (!userId) return;
      this.loading = true;
      try {
        const convos = await pb.collection('conversations').getFullList({
          filter: `participants ~ "${userId}"`,
          expand: 'participants'
        });
        this.conversations = convos;
      } catch (err) {
        console.error('Error fetching conversations:', err);
        this.error = 'Error obteniendo conversaciones';
      } finally {
        this.loading = false;
      }
    },

    /**
     * Create a new private conversation with a single friend.
     * On success, selects the new conversation as current.
     * @param {string} friendId The friend's user ID
     */
    async createConversationWith(friendId) {
      const auth = useAuthStore();
      const myId = auth.user?.id;
      if (!myId) return;
      try {
        const convo = await pb.collection('conversations').create({
          isGroup: false,
          name: '',
          participants: [myId, friendId]
        });
        this.conversations.push(convo);
        this.currentConversationId = convo.id;
        this.messages[convo.id] = [];
      } catch (err) {
        console.error('Error creating conversation:', err);
        this.error = 'Error creando conversación';
      }
    },

    /**
     * Create a new group conversation with a name and multiple participants.
     * The current user is automatically added if not present.
     * On success, selects the new conversation as current.
     * @param {string} name The group name
     * @param {string[]} participantIds Array of user IDs to include
     */
    async createGroupConversation(name, participantIds) {
      const auth = useAuthStore();
      const myId = auth.user?.id;
      if (!myId) return;
      // Ensure the current user is part of the group
      const ids = participantIds.includes(myId)
        ? participantIds
        : [...participantIds, myId];
      try {
        const convo = await pb.collection('conversations').create({
          isGroup: true,
          name: name,
          participants: ids
        });
        this.conversations.push(convo);
        this.currentConversationId = convo.id;
        this.messages[convo.id] = [];
      } catch (err) {
        console.error('Error creating group conversation:', err);
        this.error = 'Error creando grupo';
      }
    },

    /**
     * Fetch all messages for a given conversation.
     * The fetched records include the sender's expanded user object.
     * @param {string} conversationId The conversation record ID
     */
    async fetchMessages(conversationId) {
      if (!conversationId) return;
      this.loading = true;
      try {
        const msgs = await pb.collection('messages').getFullList({
          filter: `conversation="${conversationId}"`,
          sort: 'created',
          expand: 'sender'
        });
        this.messages[conversationId] = msgs;
      } catch (err) {
        console.error('Error fetching messages:', err);
        this.error = 'Error obteniendo mensajes';
      } finally {
        this.loading = false;
      }
    },

    /**
     * Send a text message in a conversation.
     * Immediately appends the new message to the local list on success.
     * @param {string} conversationId The target conversation ID
     * @param {string} content The message text
     */
    async sendMessage(conversationId, content) {
      const auth = useAuthStore();
      const myId = auth.user?.id;
      if (!myId) return;
      try {
        const msg = await pb.collection('messages').create({
          conversation: conversationId,
          sender: myId,
          content: content
        });
        // Expand with current user for consistent UI rendering
        msg.expand = {
          sender: auth.user
        };
        if (!this.messages[conversationId]) {
          this.messages[conversationId] = [];
        }
        this.messages[conversationId].push(msg);
      } catch (err) {
        console.error('Error sending message:', err);
        this.error = 'Error enviando mensaje';
      }
    },

    /**
     * Subscribe to realtime updates for a specific conversation.
     * New messages are appended to the conversation's message list.
     * @param {string} conversationId The conversation to subscribe to
     */
    async subscribeToConversation(conversationId) {
      const self = this;
      await pb.collection('messages').subscribe(
        (data) => {
          const record = data.record;
          if (record.conversation === conversationId) {
            if (!self.messages[conversationId]) {
              self.messages[conversationId] = [];
            }
            self.messages[conversationId].push(record);
          }
        },
        { filter: `conversation="${conversationId}"` }
      );
    },

    /**
     * Unsubscribe from all realtime message listeners.
     */
    async unsubscribeFromConversation() {
      pb.collection('messages').unsubscribe();
    }
  }
});