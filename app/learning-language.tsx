"use client";
import {createContext,useContext} from "react";
export type LearningLanguage="fr"|"sv";
export const LanguageContext=createContext<LearningLanguage>("fr");
export const useLearningLanguage=()=>useContext(LanguageContext);
export const languageName=(language:LearningLanguage)=>language==="sv"?"Swedish":"French";
