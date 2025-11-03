/* Barrel export para servicios */
export { askExplorer, generateExplorerImage, textToSpeech } from './explorer.service';
export { getUserStats, getUserProfile, getUserPreferences, updateUserPreferences, updateUserProfile, logout } from './user.service';
export { 
  register, 
  login, 
  loginWithGoogle, 
  createGuestSession, 
  logout as authLogout,
  getCurrentUser, 
  isAuthenticated, 
  getAccessToken, 
  refreshToken 
} from './auth.service';
export {
  listChats,
  getChat,
  saveChat,
  deleteChat,
  getUserSettings,
  updateUserSettings,
  isGuestUser,
  generateChatTitle,
  getAnimalsExplored
} from './explorerChat.service';