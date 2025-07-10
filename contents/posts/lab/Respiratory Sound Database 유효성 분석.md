---
title: Respiratory Sound Database 유효성 분석
date: 2024-10-13 12:35:24
updated: 2025-07-10 15:54:38
publish: true
tags:
  - 폐음연구
  - 학부연구생
---
기존 [HCSLAB](https://sites.google.com/view/hcslab-cau/home?authuser=0) 폐음 연구팀에서 사용하던 데이터의 질이 좋지 않아 다른 폐음 데이터셋을 찾던 와중 [ICBHI Respiratory Sound Database (The Respiratory Sound database - ICBHI 2017 Challenge)](https://paperswithcode.com/dataset/icbhi-respiratory-sound-database)을 발견했다. 폐음 연구 분야에서는 유명한 데이터셋이고 [Kaggle](https://www.kaggle.com/datasets/swapnilpanda/respiratory-sound-location)에서도 여러 사람들이 활발히 분석을 해놓은 게 많아서 우리 연구에도 쓸 수 있을지 그 결과를 보고자 한다.

**알고자 하는 건 2개다.**
1. **Dataset에서 wheeze와 crackle을 분류할 수 있는지**
2. **1번과의 연관성 유무에 상관없이, 질병과 폐음 사이에 연관성이 있는지**

## Respiratory Sound Database 
본 데이터는 원본 dataset 중 일부이다. 아쉽지만 기존 데이터 중 어떤 근거로 이 부분만 골라왔는지에 대한 설명이 없다.

### 요약
#### Contents 개요
- 126명 대상 (어린이, 성인, 노인 등 전연령대)
- 920개 .wav sound files
- 920개 annotation .txt files
- 각 환자별 질병 설명 .txt files

#### 수집 기기
- AKG C417L Microphone (AKGC417L)
- 3M Littmann Classic II SE Stethoscope (LittC2SE)
- 3M Litmmann 3200 Electronic Stethoscope (Litt3200)
- WelchAllyn Meditron Master Elite Electronic Stethoscope (Meditron)

#### 질병 종류 및 숫자

| Disease                  | Num of People |
| :----------------------- | ------------: |
| COPD (만성폐쇄성폐질환)          |            64 |
| Healthy                  |            26 |
| URTI (상기도감염)             |            14 |
| Bronchiectasis (기관지 확장증) |             7 |
| Bronchiolitis (모세기관지염)   |             6 |
| Pneumonia (폐렴)           |             2 |
| Asthma (천식)              |             1 |

#### Chest Location
![[chest location.png]]
- a. Trachea (Tc)
- b. Anterior left (Al)
- c. Anterior right (Ar)
- d. Posterior left (Pl)
- e. Posterior right (Pr)
- f. Lateral left (Ll)
- g. Lateral right (Lr)

## [CNN: Detection of wheezes and crackles](https://www.kaggle.com/code/eatmygoose/cnn-detection-of-wheezes-and-crackles)
### Overview
wheeze와 crackle을 식별하는 CNN 구현에 관한 코드. crackle 감지는 평이한데, wheeze와 wheeze & crackle이 같이 있는 소리의 경우 분류의 정확도가 비교적 낮음. 전반적인 검증 정확도는 약 70%.
![[Accuracy and Loss about detection of wheezes and crackles.png]]
![[Result of detection of wheezes and crackles.png]]
iteration을 돌려도 Loss가 불규칙하게 튀는 이유가 뭔지 모르겠다. 정확도도 그리 높은 편은 아니라서 추후 연구할 때 wheeze와 crackle을 학습하는 용도로는 부적하지 않을까 생각 중. 폐음이 측정 위치에 따라 소리의 질 차이가 큰데 본 코드에서는 위치에 상관없이 cnn 모델에 학습을 시켜서 이런 결과가 나오지 않았나 추측 중. d, e 구역에서 측정한 wav 파일이 뚜렷하게 잘 들리므로 이것들만 학습을 시켜서 다시 테스트 해볼 필요는 있어보임.
## [CNN: Disease Classification, Linked Features (95%)](https://www.kaggle.com/code/markdenton/cnn-disease-classification-linked-features-95/notebook)
### Overview
음성 데이터를 기반으로 질병을 식별하는 CNN 구현에 관한 코드. 식별이 잘되는 편, 정확도는 95%, loss는 0.2.
![[Accuracy and Loss about disease claaification.png]]
![[Result of Disease classification.png]]
질병 종류 중 가장 많이 있는 상위 6개의 class에 한해서 학습 및 테스트함. 오른쪽 자료를 보면, COPD를 제외한 다른 질병에 대한 학습 데이터 수가 너무나도 적어서 유의미한 데이터라고는 보기 힘들 것 같음. 

## 생각해볼 것들
COPD를 제외한 다른 질병에 대한 음성 파일이 너무 적은 것 같다. 본 데이터만으로 CNN 모델을 학습시키기에는 부적절하다고 생각이 들고, 원본 데이터셋에 질병별로 음성 파일이 골고루 있는지 확인해볼 필요가 있어보인다. 또 원본 데이터셋에 대한 [Benchmark](https://paperswithcode.com/dataset/icbhi-respiratory-sound-database)가 있는데 이것들에 대해 알아보는 것도 좋을 것 같다.

