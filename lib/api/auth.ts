// `components/cefr-exam/exam-header.tsx` va `writing-header.tsx` shu moduldan
// `authService.getMe()` kutadi, lekin loyihada bunday fayl yo'q edi (asosiy
// oqim buning o'rniga `lib/auth/auth-context.tsx`dagi `useAuth()` hookidan
// foydalanadi). Ikkita komponentni butunlay qayta yozish o'rniga, mavjud va
// backend bilan allaqachon to'g'ri moslangan `authApi.me()`ni shu nom bilan
// eksport qilib beramiz — ikkala joyda ham bitta haqiqiy manba ishlaydi.
import { authApi } from './endpoints'

export const authService = {
  getMe: () => authApi.me(),
}
