declare module 'zxcvbn' {
  interface ZXCVBNFeedback {
    warning: string;
    suggestions: string[];
  }

  interface ZXCVBNResult {
    score: number; // 0-4
    feedback: ZXCVBNFeedback;
    crack_times_display: Record<string, string>;
    crack_times_seconds: Record<string, number>;
    guesses: number;
    guesses_log10: number;
    sequence: Array<{
      pattern: string;
      token: string;
      [key: string]: unknown;
    }>;
    calc_time: number;
  }

  function zxcvbn(password: string, user_inputs?: string[]): ZXCVBNResult;

  export = zxcvbn;
}
