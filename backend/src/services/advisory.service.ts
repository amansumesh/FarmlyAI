import { IUser } from '../models/user.model.js';
import { WeatherService, WeatherForecastResponse } from './weather.service.js';
import { logger } from '../utils/logger.js';

export interface Recommendation {
  type: 'irrigation' | 'fertilizer' | 'pest_prevention' | 'harvest';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionBy: string;
}

export interface AdvisoryResponse {
  recommendations: Recommendation[];
  weather: WeatherForecastResponse;
  basedOn: {
    crop: string;
    location: string;
    soilType: string;
  };
}

interface CropInfo {
  irrigationFrequency: number; // days
  fertilizerStages: string[];
  commonPests: string[];
  harvestDuration: number; // days from sowing
}

export class AdvisoryService {
  private static readonly CROP_DATABASE: Record<string, CropInfo> = {
    tomato: {
      irrigationFrequency: 2,
      fertilizerStages: ['15 days', '30 days', '45 days'],
      commonPests: ['whitefly', 'aphids', 'tomato borer'],
      harvestDuration: 75,
    },
    potato: {
      irrigationFrequency: 3,
      fertilizerStages: ['20 days', '40 days'],
      commonPests: ['aphids', 'potato beetle'],
      harvestDuration: 90,
    },
    wheat: {
      irrigationFrequency: 7,
      fertilizerStages: ['21 days', '42 days'],
      commonPests: ['aphids', 'armyworms'],
      harvestDuration: 120,
    },
    rice: {
      irrigationFrequency: 1,
      fertilizerStages: ['15 days', '30 days', '50 days'],
      commonPests: ['stem borer', 'brown planthopper'],
      harvestDuration: 110,
    },
    cotton: {
      irrigationFrequency: 4,
      fertilizerStages: ['25 days', '50 days', '75 days'],
      commonPests: ['bollworm', 'whitefly', 'aphids'],
      harvestDuration: 150,
    },
    sugarcane: {
      irrigationFrequency: 7,
      fertilizerStages: ['30 days', '60 days', '90 days'],
      commonPests: ['shoot borer', 'aphids'],
      harvestDuration: 300,
    },
    onion: {
      irrigationFrequency: 3,
      fertilizerStages: ['20 days', '40 days'],
      commonPests: ['thrips', 'onion maggot'],
      harvestDuration: 100,
    },
    chili: {
      irrigationFrequency: 2,
      fertilizerStages: ['20 days', '40 days', '60 days'],
      commonPests: ['aphids', 'thrips', 'mites'],
      harvestDuration: 85,
    },
    maize: {
      irrigationFrequency: 5,
      fertilizerStages: ['20 days', '40 days'],
      commonPests: ['stem borer', 'fall armyworm'],
      harvestDuration: 90,
    },
    soybean: {
      irrigationFrequency: 5,
      fertilizerStages: ['20 days', '40 days'],
      commonPests: ['pod borer', 'aphids'],
      harvestDuration: 100,
    },
    groundnut: {
      irrigationFrequency: 5,
      fertilizerStages: ['25 days', '50 days'],
      commonPests: ['aphids', 'thrips'],
      harvestDuration: 120,
    },
    banana: {
      irrigationFrequency: 2,
      fertilizerStages: ['30 days', '60 days', '90 days', '120 days'],
      commonPests: ['aphids', 'banana weevil'],
      harvestDuration: 270,
    },
    mango: {
      irrigationFrequency: 7,
      fertilizerStages: ['before flowering', 'fruit setting', 'fruit development'],
      commonPests: ['mango hopper', 'fruit fly'],
      harvestDuration: 180,
    },
  };

  static async getRecommendations(
    user: IUser,
    language: string = 'en'
  ): Promise<AdvisoryResponse> {
    try {
      const recommendations: Recommendation[] = [];

      // Get user's location
      const lat = user.farmProfile.location?.coordinates[1] || 0;
      const lon = user.farmProfile.location?.coordinates[0] || 0;
      const locationName = user.farmProfile.location?.address || 'Unknown';

      if (!lat || !lon) {
        throw new Error('User location not available');
      }

      // Fetch weather data
      const weather = await WeatherService.getForecast(lat, lon);

      // Get primary crop
      const primaryCrop = user.farmProfile.crops[0]?.toLowerCase() || 'tomato';
      const cropInfo = this.CROP_DATABASE[primaryCrop] || this.CROP_DATABASE.tomato;
      const soilType = user.farmProfile.soilType || 'loamy';

      // Get current season
      const season = this.getCurrentSeason();

      // Generate irrigation recommendation
      const irrigationRec = this.getIrrigationRecommendation(
        weather,
        cropInfo,
        soilType,
        language
      );
      if (irrigationRec) recommendations.push(irrigationRec);

      // Generate fertilizer recommendation
      const fertilizerRec = this.getFertilizerRecommendation(
        cropInfo,
        soilType,
        season,
        language
      );
      if (fertilizerRec) recommendations.push(fertilizerRec);

      // Generate pest prevention recommendation
      const pestRec = this.getPestPreventionRecommendation(
        cropInfo,
        weather,
        season,
        language
      );
      if (pestRec) recommendations.push(pestRec);

      // Generate harvest recommendation
      const harvestRec = this.getHarvestRecommendation(
        cropInfo,
        weather,
        language
      );
      if (harvestRec) recommendations.push(harvestRec);

      // Sort by priority
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      return {
        recommendations,
        weather,
        basedOn: {
          crop: primaryCrop,
          location: locationName,
          soilType,
        },
      };
    } catch (error) {
      logger.error('Failed to generate advisory recommendations', { error });
      throw error;
    }
  }

  private static getIrrigationRecommendation(
    weather: WeatherForecastResponse,
    cropInfo: CropInfo,
    soilType: string,
    language: string
  ): Recommendation | null {
    const currentTemp = weather.current.temp;
    const currentHumidity = weather.current.humidity;
    const upcomingRain = weather.forecast.slice(0, 3).some((day) => day.pop > 50);

    let priority: 'high' | 'medium' | 'low' = 'medium';
    let title = 'Irrigation Schedule';
    let description = '';
    let actionBy = '';

    if (upcomingRain) {
      priority = 'low';
      title = language === 'hi' ? 'सिंचाई की आवश्यकता नहीं' : 'No Irrigation Needed';
      description =
        language === 'hi'
          ? `अगले 3 दिनों में बारिश की संभावना है। सिंचाई स्थगित करें और जल संचय की तैयारी करें।`
          : `Rain expected in next 3 days. Skip irrigation and prepare for water harvesting.`;
      actionBy = this.getActionDate(3);
    } else if (currentTemp > 35 || currentHumidity < 30) {
      priority = 'high';
      title = language === 'hi' ? 'तुरंत सिंचाई आवश्यक' : 'Urgent Irrigation Required';
      description =
        language === 'hi'
          ? `उच्च तापमान (${currentTemp}°C) और कम आर्द्रता (${currentHumidity}%) के कारण पौधों को पानी की तत्काल आवश्यकता है। ${
              soilType === 'sandy' ? 'रेतीली मिट्टी' : 'आपकी मिट्टी'
            } जल्दी सूख जाती है।`
          : `High temperature (${currentTemp}°C) and low humidity (${currentHumidity}%) require immediate watering. ${
              soilType === 'sandy' ? 'Sandy soil' : 'Your soil type'
            } dries quickly.`;
      actionBy = 'Today';
    } else {
      title = language === 'hi' ? 'सिंचाई अनुसूची' : 'Irrigation Schedule';
      description =
        language === 'hi'
          ? `हर ${cropInfo.irrigationFrequency} दिन में सिंचाई करें। सुबह या शाम के समय सिंचाई करें जब तापमान कम हो।`
          : `Irrigate every ${cropInfo.irrigationFrequency} days. Water in early morning or evening when temperature is lower.`;
      actionBy = this.getActionDate(cropInfo.irrigationFrequency);
    }

    return {
      type: 'irrigation',
      title,
      description,
      priority,
      actionBy,
    };
  }

  private static getFertilizerRecommendation(
    cropInfo: CropInfo,
    soilType: string,
    _season: string,
    language: string
  ): Recommendation | null {
    const priority: 'high' | 'medium' | 'low' = 'medium';
    const title = language === 'hi' ? 'उर्वरक प्रबंधन' : 'Fertilizer Management';

    let npkRatio = '19:19:19'; // Balanced
    if (soilType === 'sandy') {
      npkRatio = '20:10:10'; // More nitrogen for sandy soil
    } else if (soilType === 'clay') {
      npkRatio = '10:20:20'; // Less nitrogen for clay soil
    }

    const stages = cropInfo.fertilizerStages.join(', ');
    const description =
      language === 'hi'
        ? `NPK ${npkRatio} उर्वरक का प्रयोग करें। ${soilType === 'sandy' ? 'रेतीली मिट्टी' : soilType === 'clay' ? 'चिकनी मिट्टी' : 'आपकी मिट्टी'} के लिए उपयुक्त। प्रमुख चरण: ${stages}। जैविक खाद (कम्पोस्ट) का भी उपयोग करें।`
        : `Apply NPK ${npkRatio} fertilizer suitable for ${soilType} soil. Key stages: ${stages}. Also use organic compost for better soil health.`;

    const actionBy = this.getActionDate(7);

    return {
      type: 'fertilizer',
      title,
      description,
      priority,
      actionBy,
    };
  }

  private static getPestPreventionRecommendation(
    cropInfo: CropInfo,
    weather: WeatherForecastResponse,
    _season: string,
    language: string
  ): Recommendation | null {
    const avgHumidity =
      weather.forecast.slice(0, 3).reduce((sum, day) => sum + day.humidity, 0) / 3;

    let priority: 'high' | 'medium' | 'low' = 'medium';
    const title = language === 'hi' ? 'कीट और रोग नियंत्रण' : 'Pest and Disease Prevention';

    const commonPests = cropInfo.commonPests.join(', ');

    let description = '';
    if (avgHumidity > 80 || weather.current.humidity > 85) {
      priority = 'high';
      description =
        language === 'hi'
          ? `उच्च आर्द्रता (${Math.round(avgHumidity)}%) के कारण रोग का खतरा बढ़ गया है। सामान्य कीट: ${commonPests}। नीम का तेल या जैविक कीटनाशक का छिड़काव करें। पौधों के बीच उचित दूरी बनाए रखें।`
          : `High humidity (${Math.round(avgHumidity)}%) increases disease risk. Common pests: ${commonPests}. Spray neem oil or organic pesticides. Maintain proper plant spacing.`;
    } else {
      description =
        language === 'hi'
          ? `नियमित निगरानी करें। सामान्य कीट: ${commonPests}। पीले रंग के चिपचिपे ट्रैप लगाएं। प्रभावित पत्तियों को हटा दें। रासायनिक कीटनाशक का उपयोग केवल आवश्यकता पर करें।`
          : `Regular monitoring required. Common pests: ${commonPests}. Install yellow sticky traps. Remove affected leaves. Use chemical pesticides only when necessary.`;
    }

    const actionBy = this.getActionDate(5);

    return {
      type: 'pest_prevention',
      title,
      description,
      priority,
      actionBy,
    };
  }

  private static getHarvestRecommendation(
    cropInfo: CropInfo,
    weather: WeatherForecastResponse,
    language: string
  ): Recommendation | null {
    // This is a simplified version - in production, you'd track sowing date
    const upcomingRain = weather.forecast.slice(0, 5).some((day) => day.pop > 60);

    const priority: 'high' | 'medium' | 'low' = 'low';
    const title = language === 'hi' ? 'कटाई की योजना' : 'Harvest Planning';

    let description = '';
    if (upcomingRain) {
      description =
        language === 'hi'
          ? `आमतौर पर ${cropInfo.harvestDuration} दिनों में कटाई। अगले 5 दिनों में बारिश की संभावना है, इसलिए कटाई से पहले मौसम की निगरानी करें। शुष्क मौसम में ही कटाई करें।`
          : `Typically harvest after ${cropInfo.harvestDuration} days. Rain expected in next 5 days, so monitor weather before harvesting. Harvest only in dry weather.`;
    } else {
      description =
        language === 'hi'
          ? `आमतौर पर ${cropInfo.harvestDuration} दिनों में कटाई। परिपक्वता के लक्षणों की जांच करें। सुबह की कटाई ताजगी बनाए रखती है। कटाई के बाद उचित भंडारण सुनिश्चित करें।`
          : `Typically harvest after ${cropInfo.harvestDuration} days. Check for maturity signs. Morning harvest maintains freshness. Ensure proper post-harvest storage.`;
    }

    const actionBy = this.getActionDate(14);

    return {
      type: 'harvest',
      title,
      description,
      priority,
      actionBy,
    };
  }

  private static getCurrentSeason(): string {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 3 && month <= 6) return 'summer';
    if (month >= 7 && month <= 10) return 'monsoon';
    return 'winter';
  }

  private static getActionDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
}
