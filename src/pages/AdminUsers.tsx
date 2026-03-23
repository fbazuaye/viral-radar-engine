import { useState } from "react";
import { useIsAdmin, useAdminUsers, useUpdateProfile, useUpdateTokens, AdminUser } from "@/hooks/useAdminUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Pencil, Coins } from "lucide-react";
import { Navigate } from "react-router-dom";

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
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) => {
  const updateProfile = useUpdateProfile();
  const updateTokens = useUpdateTokens();
  const [name, setName] = useState(user?.display_name || "");
  const [tier, setTier] = useState(user?.subscription_tier || "free");
  const [channel, setChannel] = useState(user?.youtube_channel_id || "");
  const [tokens, setTokens] = useState(String(user?.balance ?? 0));

  if (!user) return null;

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
    onClose();
  };

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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateProfile.isPending || updateTokens.isPending}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminUsers = () => {
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
                  <Badge className={tierColors[user.subscription_tier] || "bg-muted"}>
                    {user.subscription_tier}
                  </Badge>
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
                  <Pencil className="h-3 w-3 mr-1" /> Edit Profile
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
      />
    </div>
  );
};

export default AdminUsers;
