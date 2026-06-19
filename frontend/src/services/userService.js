import { authService } from "./authService.js";

export const userService = {
  me() {
    return authService.currentUser();
  },
  update(values) {
    return authService.updateProfile(values);
  },
};
