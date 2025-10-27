import {atom} from 'jotai'
import { Recommendation, BackendData } from './types'

export const nodesAtom = atom([])
export const edgesAtom = atom([])
export const recommendationsAtom = atom([] as Recommendation[])
export const backendDataAtom = atom({} as BackendData)
export const keywordsListAnswerAtom = atom([] as string[])
export const keywordsListQuestionAtom = atom([] as string[])
export const gptTriplesAtom = atom([] as string[][])
