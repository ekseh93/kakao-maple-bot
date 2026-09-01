# App Runner 배포 권한 요청서

현재 AWS 역할 `AWSReservedSSO_KakaoMapleDeveloper`는 계정 인증은 가능하지만 App Runner와 ECR 조회 권한이 없어 PC 견적 Adapter 배포를 시작할 수 없습니다.

## 확인된 거부

```text
apprunner:ListServices
ecr:DescribeRepositories
```

## 필요한 범위

관리자에게 다음 범위의 권한 세트를 요청합니다. 실제 역할 ARN은 계정의 IAM Identity Center에서 확인해 입력합니다.

- App Runner: 서비스 생성·조회·수정·삭제·일시중지/재개·자동 확장 설정 조회
- ECR: 전용 `kakao-pc-deals-adapter` 저장소 생성·조회·이미지 업로드
- IAM: App Runner가 ECR 이미지를 읽을 때 사용할 전용 역할에 대한 `iam:PassRole`
- CloudWatch Logs: Adapter 로그 그룹 조회·작성

저장소와 서비스 이름은 `kakao-pc-deals-adapter`로 제한하고, 다른 프로젝트 리소스에는 권한을 부여하지 않습니다. 권한을 추가한 뒤 `aws sts get-caller-identity`와 App Runner/ECR 읽기 명령으로 확인하고, Terraform plan에서 생성 목록과 비용을 검토한 다음에만 apply합니다.

## 사용자 승인 경계

App Runner는 유휴 시간에도 프로비저닝된 컨테이너 메모리 비용이 발생할 수 있습니다. 권한이 추가되어도 비용·호스팅 방식에 대한 사용자 확인 없이 리소스를 생성하지 않습니다.
