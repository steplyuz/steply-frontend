// Speaking imtihoni: imtihonchi matnlari (PDF "Namunaviy topshiriqlar" asosida) va vaqtlar.
// Imtihonchi matnlari ovozli o'qiladi (examiner.ts), nomzodga o'zbekcha yo'riqnoma ko'rsatiladi.

export type SpeakingPartKey = "part_1_1" | "part_1_2" | "part_2" | "part_3"

export const PART_ORDER: SpeakingPartKey[] = ["part_1_1", "part_1_2", "part_2", "part_3"]

export interface PartInstruction {
    shortTitle: string
    title: string
    /** Imtihonchi qismning boshida aytadigan matn (ingliz tilida, ovozli o'qiladi) */
    examinerEn: string
    /** Nomzod uchun o'zbekcha yo'riqnoma */
    candidateUz: string
    /** Savol boshlanishidan oldingi tayyorgarlik (soniya). PDF'ga ko'ra 1.1 va 1.2 da yo'q. */
    prepSeconds: number
    /** Har bir javob uchun (yoki umumiy) vaqt (soniya) */
    answerSeconds: number
}

export const PART_INSTRUCTIONS: Record<SpeakingPartKey, PartInstruction> = {
    part_1_1: {
        shortTitle: "Part 1.1",
        title: "Part 1.1 · Shaxsiy savollar (A1–A2)",
        examinerEn:
            "Part one. In this part, I'm going to ask you three short questions about yourself and your interests. " +
            "You will have 30 seconds to reply to each question. Begin speaking when you hear this sound.",
        candidateUz: "Har bir savolga 30 soniya beriladi. Savol tugagach signal eshitiladi va yozuv avtomatik boshlanadi.",
        prepSeconds: 0,
        answerSeconds: 30,
    },
    part_1_2: {
        shortTitle: "Part 1.2",
        title: "Part 1.2 · Rasmlarni solishtirish (B1)",
        examinerEn:
            "Now, I'm going to ask you to compare two pictures and I will ask you two questions about them. " +
            "Look at the photographs.",
        candidateUz: "Ikki rasmni solishtiring. 4-savolga 45 soniya, 5 va 6-savollarga 30 soniya beriladi.",
        prepSeconds: 0,
        answerSeconds: 45,
    },
    part_2: {
        shortTitle: "Part 2",
        title: "Part 2 · Abstrakt mavzu (B2)",
        examinerEn:
            "Part two. In this part, I'm going to show you a picture and ask you three questions. " +
            "You will have one minute to think about your answers before you start speaking. " +
            "You will have two minutes to answer all three questions. Begin speaking when you hear this sound. " +
            "Look at the photograph.",
        candidateUz: "1 daqiqa tayyorgarlik, so'ng 2 daqiqa. Uchala savolga bitta yozuvda javob bering.",
        prepSeconds: 60,
        answerSeconds: 120,
    },
    part_3: {
        shortTitle: "Part 3",
        title: "Part 3 · Munozara (C1)",
        examinerEn:
            "Part three. In this part, you are going to speak on a topic for two minutes. " +
            "You can see the topic on the screen and two lists of points, for and against, related to the topic. " +
            "Choose two items from each list and give a balanced argument to represent both sides of the topic. " +
            "You have one minute to prepare your argument. You will then have two minutes to speak. " +
            "Begin speaking when you hear this sound.",
        candidateUz: "1 daqiqa tayyorgarlik, so'ng 2 daqiqa nutq. Mavzuning ikki tomonini ham yoriting.",
        prepSeconds: 60,
        answerSeconds: 120,
    },
}
