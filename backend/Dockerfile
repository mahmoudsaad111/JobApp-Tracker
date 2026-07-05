
FROM mcr.microsoft.com/dotnet/aspnet:10.0 as base
WORKDIR /app 
EXPOSE 8080 


FROM mcr.microsoft.com/dotnet/sdk:10.0 as build
WORKDIR /src
COPY src/JobAppTracker.API/JobAppTracker.API.csproj                         src/JobAppTracker.API/
COPY src/JobAppTracker.Domain/JobAppTracker.Domain.csproj                   src/JobAppTracker.Domain/
COPY src/JobAppTracker.Application/JobAppTracker.Application.csproj         src/JobAppTracker.Application/
COPY src/JobAppTracker.Infrastructure/JobAppTracker.Infrastructure.csproj   src/JobAppTracker.Infrastructure/
RUN dotnet restore src/JobAppTracker.API/JobAppTracker.API.csproj
COPY . .
RUN dotnet build src/JobAppTracker.API/JobAppTracker.API.csproj  -c Release --no-restore -o /app/build


FROM build AS publish
RUN dotnet publish src/JobAppTracker.API/JobAppTracker.API.csproj -c Release --no-restore -o /app/publish

FROM base AS final    
WORKDIR /app    
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "JobAppTracker.API.dll"]