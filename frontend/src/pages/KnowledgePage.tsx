import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, BookOpen, ChevronRight, Sprout, Bug, Settings, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import knowledgeDataRaw from '../data/knowledge.json';
import { KnowledgeItem, LanguageCode } from '../types/knowledge.types';

// Cast data to correct type
const knowledgeData = knowledgeDataRaw as unknown as KnowledgeItem[];

const KnowledgePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  const currentLang = (i18n.language?.split('-')[0] || 'en') as LanguageCode;

  const categories = [
    { id: 'all', label: t('knowledge.all'), icon: BookOpen },
    { id: 'crop_cultivation', label: t('knowledge.cropCultivation'), icon: Sprout },
    { id: 'disease_management', label: t('knowledge.diseaseManagement'), icon: Bug },
    { id: 'farming_technique', label: t('knowledge.farmingTechnique'), icon: Settings },
    { id: 'app_guide', label: t('knowledge.appGuide'), icon: Leaf },
  ];

  const langMap: Record<string, string> = {
    en: 'english',
    hi: 'hindi',
    ta: 'tamil',
    te: 'telugu',
    ml: 'malayalam',
    kn: 'kannada',
  };

  const getContent = (item: KnowledgeItem) => {
    const langKey = langMap[currentLang] || 'english';
    return item.content[langKey] || item.content['english'];
  };

  const getCropName = (crop: string) => {
    return t(`knowledge.cropNames.${crop}`, crop);
  };

  const getDiseaseName = (disease: string) => {
    return t(`knowledge.diseaseNames.${disease}`, disease);
  };

  const filteredData = useMemo(() => {
    return knowledgeData.filter((item) => {
      const content = getContent(item);
      if (!content) return false;

      const searchLower = searchQuery.toLowerCase();

      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      const localizedCrop = getCropName(item.crop).toLowerCase();
      const localizedDisease = getDiseaseName(item.disease).toLowerCase();

      return (
        item.crop.toLowerCase().includes(searchLower) ||
        item.disease.toLowerCase().includes(searchLower) ||
        localizedCrop.includes(searchLower) ||
        localizedDisease.includes(searchLower) ||
        content.symptoms.toLowerCase().includes(searchLower)
      );
    });
  }, [searchQuery, selectedCategory, currentLang]);

  return (
    <div className="pb-24 pt-6 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('knowledge.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('knowledge.articlesAvailable', { count: filteredData.length })}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-2 space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder={t('knowledge.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${isSelected
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                  }`}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredData.map((item) => {
            const content = getContent(item);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-md">
                    {getCropName(item.crop)}
                  </span>
                  <ChevronRight className="text-gray-400 h-5 w-5" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {getDiseaseName(item.disease)}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                  {content.symptoms}
                </p>

                <div className="mt-4 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                  {t('knowledge.readMore')}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Detail Modal/Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 sm:p-6"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto p-6 shadow-xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6 sm:hidden" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-green-600 dark:text-green-400 font-medium text-sm tracking-wide uppercase">
                    {getCropName(selectedItem.crop)}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {getDiseaseName(selectedItem.disease)}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <span className="text-xl">&times;</span>
                </button>
              </div>

              <div className="space-y-6">
                <Section title={t('knowledge.symptoms')} content={getContent(selectedItem).symptoms} color="text-red-600" />
                <Section title={t('knowledge.treatment')} content={getContent(selectedItem).treatment} color="text-blue-600" />
                <Section title={t('knowledge.prevention')} content={getContent(selectedItem).prevention} color="text-green-600" />
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  {t('common.done')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Section = ({ title, content, color }: { title: string; content: string; color: string }) => (
  <div>
    <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${color}`}>
      {title}
    </h4>
    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
      {content}
    </p>
  </div>
);

export default KnowledgePage;
