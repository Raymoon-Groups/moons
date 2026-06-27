import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { OnboardingGuard } from '../common/guards/onboarding.guard';
import { ConnectionsService } from './connections.service';
import { SearchProfessionalsDto } from './dto/search-professionals.dto';
import { SendConnectionDto } from './dto/send-connection.dto';
import { UpdateNetworkPrivacyDto } from './dto/update-network-privacy.dto';
import { NetworkProfilesService } from './network-profiles.service';
import { RecommendationsService } from './recommendations.service';

@ApiTags('network')
@Controller('network')
@UseGuards(JwtAuthGuard, OnboardingGuard)
@ApiBearerAuth()
export class NetworkController {
  constructor(
    private connections: ConnectionsService,
    private recommendations: RecommendationsService,
    private profiles: NetworkProfilesService,
  ) {}

  @Get('stats')
  stats(@CurrentUser() user: JwtPayload) {
    return this.connections.getNetworkStats(user.sub);
  }

  @Get('connections')
  listConnections(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.connections.listConnections(
      user.sub,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('connections/recent')
  recentConnections(@CurrentUser() user: JwtPayload) {
    return this.connections.listRecentlyConnected(user.sub);
  }

  @Get('connections/pending/received')
  pendingReceived(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.connections.listPendingReceived(
      user.sub,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('connections/pending/sent')
  pendingSent(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.connections.listPendingSent(
      user.sub,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('connections/mutual/:userId')
  mutualConnections(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ) {
    return this.connections.getMutualConnections(user.sub, userId);
  }

  @Get('connections/status/:userId')
  connectionStatus(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ) {
    return this.connections.getStatus(user.sub, userId);
  }

  @Post('connections/request')
  sendRequest(@CurrentUser() user: JwtPayload, @Body() dto: SendConnectionDto) {
    return this.connections.sendRequest(user.sub, dto);
  }

  @Post('connections/:id/accept')
  acceptRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.connections.acceptRequest(user.sub, id);
  }

  @Post('connections/:id/reject')
  rejectRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.connections.rejectRequest(user.sub, id);
  }

  @Post('connections/:id/cancel')
  cancelRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.connections.cancelRequest(user.sub, id);
  }

  @Delete('connections/user/:userId')
  removeConnection(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ) {
    return this.connections.removeConnection(user.sub, userId);
  }

  @Post('block/:userId')
  blockUser(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.connections.blockUser(user.sub, userId, reason);
  }

  @Get('suggestions')
  suggestions(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendations.getSuggestions(
      user.sub,
      Number(page) || 1,
      Number(limit) || 12,
    );
  }

  @Get('search')
  search(
    @CurrentUser() user: JwtPayload,
    @Query() dto: SearchProfessionalsDto,
  ) {
    return this.profiles.searchProfessionals(user.sub, dto);
  }

  @Get('visitors')
  visitors(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.profiles.listProfileVisitors(
      user.sub,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('profiles/:userId')
  getProfile(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ) {
    return this.profiles.getProfile(user.sub, userId);
  }

  @Patch('privacy')
  updatePrivacy(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateNetworkPrivacyDto,
  ) {
    return this.profiles.updatePrivacy(user.sub, dto);
  }
}
