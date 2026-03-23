import { useState, useEffect } from "react";
import { useIsAdmin, useAdminUsers, useUpdateProfile, useUpdateTokens, useGrantRole, useRevokeRole, AdminUser } from "@/hooks/useAdminUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Users, Pencil, Coins, ShieldCheck, ShieldAlert } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const tiers = ["free", "starter", "pro", "agency"];

const tierColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-primary/20 text-primary",
  pro: "bg-accent text-accent-foreground",
  agency: "bg-destructive/20 text-destructive",
};

const EditUserDialog = ({
  user,
  open,
  onClose,
  currentUserId,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  currentUserId?: string;
}) => {
  const updateProfile = useUpdateProfile();
  const updateTokens = useUpdateTokens();
  const grantRole = useGrantRole();
  const revokeRole = useRevokeRole();

  const [name, setName] = useState("");
  const [tier, setTier] = useState("free");
  const [channel, setChannel] = useState("");
  const [tokens, setTokens] = useState("0");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.display_name || "");
      setTier(user.subscription_tier || "free");
      setChannel(user.youtube_channel_id || "");
      setTokens(String(user.balance ?? 0));
      setIsAdmin(user.roles.includes("admin"));
      setIsModerator(user.roles.includes("moderator"));
    }
  }, [user]);

  if (!user) return null;

  const isSelf = user.user_id === currentUserId;

  const handleSave = async () => {
    await updateProfile.mutateAsync({
      user_id: user.user_id,
      updates: {
        display_name: name,
        subscription_tier: tier,
        youtube_channel_id: channel || undefined,
      },
    });

    const newBalance = parseInt(tokens, 10);
    if (!isNaN(newBalance) && newBalance !== user.balance) {
      await updateTokens.mutateAsync({ user_id: user.user_id, balance: newBalance });
    }

    // Role changes
    const hadAdmin = user.roles.includes("admin");
    const hadMod = user.roles.includes("moderator");

    if (isAdmin && !hadAdmin) await grantRole.mutateAsync({ user_id: user.user_id, role: "admin" });
    if (!isAdmin && hadAdmin && !isSelf) await revokeRole.mutateAsync({ user_id: user.user_id, role: "admin" });
    if (isModerator && !hadMod) await grantRole.mutateAsync({ user_id: user.user_id, role: "moderator" });
    if (!isModerator && hadMod) await revokeRole.mutateAsync({ user_id: user.user_id, role: "moderator" });

    onClose();
  };

  const isPending = updateProfile.isPending || updateTokens.isPending || grantRole.isPending || revokeRole.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Edit User
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Display Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Subscription Tier</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>YouTube Channel ID</Label>
            <Input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Token Balance</Label>
            <Input type="number" value={tokens} onChange={(e) => setTokens(e.target.value)} min={0} />
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1">
              <Shield className="h-4 w-4" /> Roles
            </Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-sm">Admin</span>
              </div>
              <Switch
                checked={isAdmin}
                onCheckedChange={setIsAdmin}
                disabled={isSelf}
              />
            </div>
            {isSelf && (
              <p className="text-xs text-muted-foreground">You cannot remove your own admin role.</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-accent-foreground" />
                <span className="text-sm">Moderator</span>
              </div>
              <Switch
                checked={isModerator}
                onCheckedChange={setIsModerator}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminUsers = () => {
  const { session } = useAuth();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: users, isLoading } = useAdminUsers();
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");

  if (checkingAdmin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const filtered = (users || []).filter((u) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
        </div>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" /> {users?.length ?? 0} users
        </Badge>
      </div>

      <Input
        placeholder="Search by name or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((user) => (
            <Card key={user.user_id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium truncate">
                    {user.display_name || "Unnamed"}
                  </CardTitle>
                  <div className="flex gap-1">
                    {user.roles.includes("admin") && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">admin</Badge>
                    )}
                    {user.roles.includes("moderator") && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">mod</Badge>
                    )}
                    <Badge className={tierColors[user.subscription_tier] || "bg-muted"}>
                      {user.subscription_tier}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> Tokens</span>
                  <span className="font-medium text-foreground">{user.balance}</span>
                </div>
                {user.youtube_channel_id && (
                  <p className="text-xs text-muted-foreground truncate">
                    Channel: {user.youtube_channel_id}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setEditUser(user)}
                >
                  <Pencil className="h-3 w-3 mr-1" /> Edit Profile & Roles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onClose={() => setEditUser(null)}
        currentUserId={session?.user?.id}
      />
    </div>
  );
};

export default AdminUsers;
