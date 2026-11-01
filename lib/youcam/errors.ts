/** YouCam error codes → specific capture guidance (docs/05). */
export const YOUCAM_ERROR_MESSAGES: Record<string, string> = {
  error_below_min_image_size: "Your camera image is too small. Move closer or use a higher camera resolution.",
  error_exceed_max_image_size: "The photo is too large. Please retake it.",
  error_src_face_too_small: "Move closer so your face fills the outline.",
  error_src_face_out_of_bound: "Centre your face inside the outline.",
  error_lighting_dark: "Too dark. Face a window or turn on a light in front of you.",
  InvalidAccessToken: "The analysis service rejected our credentials. Please try again later.",
  InvalidApiKey: "The analysis service rejected our credentials. Please try again later.",
  error_face_angle: "Keep your head straight and look directly at the camera.",
  error_no_face: "We couldn't find a face. Show your whole face, facing the camera.",
  error_pose: "Look straight at the camera with your head level.",
  error_nsfw_content_detected: "This photo can't be processed. Please use a plain selfie.",
  error_invalid_params: "That option isn't supported. Please pick another.",
  error_mismatch_image_size: "All three photos need the same size. Please retake them.",
  error_face_angle_invalid: "Front photo: look straight ahead. Side photos: turn your head well to the side.",
  error_insufficient_lighting: "Too dark. Face a window or turn on a light.",
  rate_limited: "Too many scans in a short time. Wait a minute and try again.",
  timeout: "The analysis took too long. Please try again.",
};

const GENERIC = "Something went wrong while analysing your photo. Please try again.";

export class YoucamError extends Error {
  constructor(
    public code: string,
    public status = 500,
    detail?: string,
  ) {
    super(detail ?? code);
    this.name = "YoucamError";
  }
  get userMessage(): string {
    return friendlyMessage(this.code);
  }
}

export function friendlyMessage(code: string): string {
  // Angle errors come in variants (error_face_angle_left_tilt, …_right_turn); one message covers them.
  return YOUCAM_ERROR_MESSAGES[code] ?? (code.startsWith("error_face_angle") ? YOUCAM_ERROR_MESSAGES.error_face_angle : GENERIC);
}

/** Find a known error code anywhere in an error payload (shape varies by endpoint). */
export function extractErrorCode(payload: unknown): string {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload ?? "");
  return text.match(/error_face_angle_[a-z_]+/)?.[0] ?? Object.keys(YOUCAM_ERROR_MESSAGES).find((k) => text.includes(k)) ?? "unknown_error";
}
